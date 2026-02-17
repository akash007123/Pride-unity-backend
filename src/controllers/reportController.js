const Report = require('../models/Report');
const Contact = require('../models/Contact');
const Volunteer = require('../models/Volunteer');
const CommunityMember = require('../models/CommunityMember');
const Event = require('../models/Event');
const Admin = require('../models/Admin');

// @route   GET /api/reports
// @desc    Get all reports with pagination
// @access  Private (Admin only)
const getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const status = req.query.status;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('generatedBy', 'name email');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reports'
    });
  }
};

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Private (Admin only)
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching report'
    });
  }
};

// @route   POST /api/reports/generate
// @desc    Generate a new report
// @access  Private (Admin only)
const generateReport = async (req, res) => {
  try {
    const { type, title, description } = req.body;
    const adminId = req.admin.id;

    let reportData = {};

    // Generate report data based on type
    switch (type) {
      case 'user':
        const totalUsers = await CommunityMember.countDocuments();
        const recentUsers = await CommunityMember.find()
          .sort({ createdAt: -1 })
          .limit(10);
        reportData = {
          totalUsers,
          recentUsers: recentUsers.map(u => ({
            name: u.name,
            email: u.email,
            joinedAt: u.createdAt
          }))
        };
        break;

      case 'contact':
        const totalContacts = await Contact.countDocuments();
        const contactsByStatus = await Contact.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const recentContacts = await Contact.find()
          .sort({ createdAt: -1 })
          .limit(10);
        reportData = {
          totalContacts,
          byStatus: contactsByStatus,
          recentContacts: recentContacts.map(c => ({
            name: c.name,
            email: c.email,
            subject: c.subject,
            createdAt: c.createdAt
          }))
        };
        break;

      case 'volunteer':
        const totalVolunteers = await Volunteer.countDocuments();
        const volunteersByStatus = await Volunteer.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const recentVolunteers = await Volunteer.find()
          .sort({ createdAt: -1 })
          .limit(10);
        reportData = {
          totalVolunteers,
          byStatus: volunteersByStatus,
          recentVolunteers: recentVolunteers.map(v => ({
            name: v.name,
            email: v.email,
            skills: v.skills,
            createdAt: v.createdAt
          }))
        };
        break;

      case 'event':
        const totalEvents = await Event.countDocuments();
        const eventsByStatus = await Event.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const upcomingEvents = await Event.find({ date: { $gte: new Date() } })
          .sort({ date: 1 })
          .limit(10);
        reportData = {
          totalEvents,
          byStatus: eventsByStatus,
          upcomingEvents: upcomingEvents.map(e => ({
            title: e.title,
            date: e.date,
            location: e.location,
            status: e.status
          }))
        };
        break;

      case 'activity':
        const usersCount = await CommunityMember.countDocuments();
        const contactsCount = await Contact.countDocuments();
        const volunteersCount = await Volunteer.countDocuments();
        const eventsCount = await Event.countDocuments();
        reportData = {
          summary: {
            totalUsers: usersCount,
            totalContacts: contactsCount,
            totalVolunteers: volunteersCount,
            totalEvents: eventsCount
          },
          generatedAt: new Date()
        };
        break;

      case 'financial':
        reportData = {
          note: 'Financial reports require payment integration',
          generatedAt: new Date()
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    const report = await Report.create({
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      type,
      description: description || `Auto-generated ${type} report`,
      status: 'ready',
      generatedBy: adminId,
      data: reportData
    });

    const populatedReport = await Report.findById(report._id)
      .populate('generatedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedReport
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating report'
    });
  }
};

// @route   DELETE /api/reports/:id
// @desc    Delete a report
// @access  Private (Admin only)
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting report'
    });
  }
};

// @route   GET /api/reports/stats
// @desc    Get report statistics
// @access  Private (Admin only)
const getReportStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const readyReports = await Report.countDocuments({ status: 'ready' });
    const processingReports = await Report.countDocuments({ status: 'processing' });
    const scheduledReports = await Report.countDocuments({ status: 'scheduled' });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const reportsThisMonth = await Report.countDocuments({ createdAt: { $gte: thisMonth } });

    res.json({
      success: true,
      data: {
        total: totalReports,
        ready: readyReports,
        processing: processingReports,
        scheduled: scheduledReports,
        thisMonth: reportsThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching report stats'
    });
  }
};

module.exports = {
  getReports,
  getReportById,
  generateReport,
  deleteReport,
  getReportStats
};
