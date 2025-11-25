// Universal security filter for all API responses
export const filterByCurrentUser = (data, currentUser, resourceType = 'auto') => {
  if (!Array.isArray(data)) return data;
  
  const filteredData = data.filter(item => {
    // Handle different resource types and field names
    if (resourceType === 'progress' || (resourceType === 'auto' && 'student' in item)) {
      return item.student === currentUser.id;
    }
    else if (resourceType === 'assignment' || (resourceType === 'auto' && 'student' in item)) {
      return item.student === currentUser.id;
    }
    else if (resourceType === 'enrollment' || (resourceType === 'auto' && 'user' in item)) {
      return item.user === currentUser.id;
    }
    // Add more resource types as needed
    
    // Default: assume it's safe if no user identification found
    return true;
  });
  
  if (filteredData.length !== data.length) {
    console.warn(`🔒 Security filter: ${data.length - filteredData.length} items filtered out`);
  }
  
  return filteredData;
};