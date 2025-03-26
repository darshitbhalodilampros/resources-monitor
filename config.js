module.exports = {
  processRecipients: {
    'prod-cc': {
      to: ['darshitbhalodia@lampros.tech', 'yashprajapati@lampros.tech'],
      cc: 'hirangi@lampros.tech',
    },
    'prod-meet-cc': {
      to: ['darshitbhalodia@lampros.tech', 'yashprajapati@lampros.tech'],
      cc: 'hirangi@lampros.tech',
    },
    'PM2-Alert': {
      to: ['darshitbhalodia@lampros.tech', 'yashprajapati@lampros.tech'],
      cc: 'akashpalan@lampros.tech',
    },
    'System-Alert': {
      to: ['darshitbhalodia@lampros.tech', 'yashprajapati@lampros.tech'],
      cc: 'akashpalan@lampros.tech',
    },
    'docs.daocpi.com': {
      to: ['darshitbhalodia@lampros.tech', 'vinitpithadiya@lampros.tech'],
      cc: 'yashprajapati@lampros.tech',
    },
    'officehours-cron': {
      to: ['darshitbhalodia@lampros.tech', 'vinitpithadiya@lampros.tech'],
      cc: 'yashprajapati@lampros.tech',
    },
    'optimism-cpi-calculation': {
      to: ['darshitbhalodia@lampros.tech', 'vinitpithadiya@lampros.tech'],
      cc: 'yashprajapati@lampros.tech',
    },
    'weeklyreport-service': {
      to: ['darshitbhalodia@lampros.tech', 'nikhilsondarava@lampros.tech'],
      cc: 'yashprajapati@lampros.tech',
    },
    'worker-service': {
      to: ['darshitbhalodia@lampros.tech', 'nikhilsondarava@lampros.tech'],
      cc: 'yashprajapati@lampros.tech',
    },
    'index-service': {
      to: ['darshitbhalodia@lampros.tech', 'nikhilsondarava@lampros.tech'],
      cc: 'yashprajapati@lampros.tech',
    },
    'test': {
      to: ['darshitbhalodia@lampros.tech', 'darshitbhalodi@gmail.com'],
      cc: 'darshitbhalodi@gmail.com',
    },
    '_default': {
      to: process.env.SMTP_TO,
      cc: process.env.SMTP_CC,
    },
  },
  monitoringConfig: {
    monitoredEvents: ['start', 'error', 'stop'],
    excludedProcessIds: [8,2,3],
  },
};
