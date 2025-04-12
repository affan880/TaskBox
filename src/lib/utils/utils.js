export const getCurrentScreenTitle = (currentScreenName) => {
    switch (currentScreenName) {
      case 'AllInbox': return 'All inbox';
      case 'Primary': return 'Primary';
      case 'Social': return 'Social';
      case 'Promotions': return 'Promotions';
      case 'Starred': return 'Starred';
      case 'Snoozed': return 'Snoozed';
      case 'Important': return 'Important';
      case 'Sent': return 'Sent';
      case 'Scheduled': return 'Scheduled';
      case 'Drafts': return 'Drafts';
      case 'Spam': return 'Spam';
      case 'Trash': return 'Trash';
      default: return 'Inbox';
    }
  };
