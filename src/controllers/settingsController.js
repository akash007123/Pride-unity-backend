const Settings = require('../models/Settings');

// Default settings to seed
const defaultSettings = [
  // General
  { key: 'site_name', value: 'Pride Community', category: 'general', description: 'The name of your organization', type: 'string' },
  { key: 'site_description', value: 'Supporting the LGBTQ+ community', category: 'general', description: 'A brief description of your organization', type: 'string' },
  { key: 'timezone', value: 'Asia/Colombo', category: 'general', description: 'Set the default timezone for your site', type: 'string' },
  { key: 'language', value: 'English', category: 'general', description: 'Set the default language for your site', type: 'string' },
  
  // Notifications
  { key: 'email_notifications', value: true, category: 'notifications', description: 'Receive email notifications for important updates', type: 'boolean' },
  { key: 'new_user_registered', value: true, category: 'notifications', description: 'Get notified when a new user registers', type: 'boolean' },
  { key: 'new_contact_form', value: true, category: 'notifications', description: 'Get notified when someone submits the contact form', type: 'boolean' },
  { key: 'new_volunteer', value: true, category: 'notifications', description: 'Get notified when someone signs up as a volunteer', type: 'boolean' },
  { key: 'event_reminders', value: false, category: 'notifications', description: 'Receive reminders about upcoming events', type: 'boolean' },
  { key: 'weekly_digest', value: true, category: 'notifications', description: 'Receive a weekly summary of activity', type: 'boolean' },
  
  // Security
  { key: 'two_factor', value: false, category: 'security', description: 'Enable 2FA for additional security', type: 'boolean' },
  { key: 'session_timeout', value: '30', category: 'security', description: 'Auto logout after period of inactivity (minutes)', type: 'number' },
  { key: 'password_expiry', value: '90', category: 'security', description: 'Force password change after set days', type: 'number' },
  { key: 'login_attempts', value: '5', category: 'security', description: 'Number of failed attempts before lockout', type: 'number' },
  
  // Appearance
  { key: 'theme_mode', value: 'light', category: 'appearance', description: 'Choose between light, dark, or system theme', type: 'string' },
  { key: 'primary_color', value: '#8B5CF6', category: 'appearance', description: 'Set the main accent color for your site', type: 'string' },
  
  // Integrations
  { key: 'google_analytics', value: false, category: 'integrations', description: 'Enable Google Analytics tracking', type: 'boolean' },
  { key: 'google_analytics_id', value: '', category: 'integrations', description: 'Google Analytics Tracking ID', type: 'string' },
  { key: 'facebook_pixel', value: false, category: 'integrations', description: 'Enable Facebook Pixel for ads', type: 'boolean' },
  { key: 'facebook_pixel_id', value: '', category: 'integrations', description: 'Facebook Pixel ID', type: 'string' },
  { key: 'mailchimp', value: false, category: 'integrations', description: 'Connect with Mailchimp for newsletters', type: 'boolean' },
  { key: 'mailchimp_api_key', value: '', category: 'integrations', description: 'Mailchimp API Key', type: 'string' },
  { key: 'social_login', value: false, category: 'integrations', description: 'Allow users to login with social accounts', type: 'boolean' },
  
  // Backup
  { key: 'auto_backup', value: true, category: 'backup', description: 'Automatically backup your data', type: 'boolean' },
  { key: 'backup_frequency', value: 'daily', category: 'backup', description: 'How often to create backups', type: 'string' },
  { key: 'backup_location', value: 'cloud', category: 'backup', description: 'Where to store backups', type: 'string' },
  { key: 'retain_backups', value: '30', category: 'backup', description: 'Number of backups to keep', type: 'number' }
];

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private (Admin only)
const getSettings = async (req, res) => {
  try {
    const category = req.query.category;
    const query = category ? { category } : {};

    const settings = await Settings.find(query);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings'
    });
  }
};

// @route   GET /api/settings/:key
// @desc    Get single setting by key
// @access  Private (Admin only)
const getSettingByKey = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching setting'
    });
  }
};

// @route   PUT /api/settings/:key
// @desc    Update a setting
// @access  Private (Admin only)
const updateSetting = async (req, res) => {
  try {
    const { value } = req.body;

    let setting = await Settings.findOne({ key: req.params.key });

    if (!setting) {
      // Create new setting if it doesn't exist
      setting = await Settings.create({
        key: req.params.key,
        value,
        category: req.body.category || 'general',
        description: req.body.description || '',
        type: req.body.type || 'string'
      });
    } else {
      setting.value = value;
      await setting.save();
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating setting'
    });
  }
};

// @route   PUT /api/settings
// @desc    Update multiple settings
// @access  Private (Admin only)
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings must be an array'
      });
    }

    const updatedSettings = [];
    for (const item of settings) {
      let setting = await Settings.findOne({ key: item.key });
      
      if (setting) {
        setting.value = item.value;
        await setting.save();
      } else {
        setting = await Settings.create({
          key: item.key,
          value: item.value,
          category: item.category || 'general',
          description: item.description || '',
          type: item.type || 'string'
        });
      }
      
      updatedSettings.push(setting);
    }

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating settings'
    });
  }
};

// @route   POST /api/settings/seed
// @desc    Seed default settings
// @access  Private (Admin only)
const seedSettings = async (req, res) => {
  try {
    for (const setting of defaultSettings) {
      await Settings.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }

    const settings = await Settings.find();

    res.json({
      success: true,
      data: settings,
      message: 'Settings seeded successfully'
    });
  } catch (error) {
    console.error('Error seeding settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error seeding settings'
    });
  }
};

// @route   GET /api/settings/stats
// @desc    Get settings statistics
// @access  Private (Admin only)
const getSettingsStats = async (req, res) => {
  try {
    const totalSettings = await Settings.countDocuments();
    
    const byCategory = await Settings.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const activeNotifications = await Settings.countDocuments({
      category: 'notifications',
      value: true
    });

    const activeIntegrations = await Settings.countDocuments({
      category: 'integrations',
      value: true
    });

    res.json({
      success: true,
      data: {
        total: totalSettings,
        byCategory,
        activeNotifications,
        activeIntegrations
      }
    });
  } catch (error) {
    console.error('Error fetching settings stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings stats'
    });
  }
};

module.exports = {
  getSettings,
  getSettingByKey,
  updateSetting,
  updateSettings,
  seedSettings,
  getSettingsStats
};
