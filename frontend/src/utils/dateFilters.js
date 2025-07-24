// Date filtering utilities

/**
 * Filters responses based on date range
 * @param {Array} responses - Array of form responses
 * @param {string} dateFilter - Date filter type ('all', 'today', 'week', 'month', 'year')
 * @returns {Array} - Filtered responses
 */
export const filterResponsesByDate = (responses, dateFilter) => {
  if (dateFilter === 'all') {
    return responses;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return responses.filter(response => {
    const responseDate = new Date(response.submittedAt);
    
    switch (dateFilter) {
      case 'today':
        const responseDay = new Date(responseDate.getFullYear(), responseDate.getMonth(), responseDate.getDate());
        return responseDay.getTime() === today.getTime();
        
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return responseDate >= weekAgo;
        
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return responseDate >= monthAgo;
        
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        return responseDate >= yearAgo;
        
      default:
        return true;
    }
  });
};

/**
 * Gets a human-readable date range description
 * @param {string} dateFilter - Date filter type
 * @returns {string} - Description of the date range
 */
export const getDateRangeDescription = (dateFilter) => {
  switch (dateFilter) {
    case 'today':
      return 'Today';
    case 'week':
      return 'Last 7 days';
    case 'month':
      return 'Last 30 days';
    case 'year':
      return 'Last year';
    default:
      return 'All time';
  }
};