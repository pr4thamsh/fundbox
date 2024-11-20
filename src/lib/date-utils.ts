export const fixDate = (dateString: string | null) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date;
  };
  
  export const formatDateForAPI = (date: Date) => {
    return date.toISOString().split("T")[0];
  };
  
  export const isActiveFundraiser = (startDate: string, endDate: string) => {
    const start = fixDate(startDate);
    const end = fixDate(endDate);
    const now = new Date();
    return start <= now && end >= now;
  };
