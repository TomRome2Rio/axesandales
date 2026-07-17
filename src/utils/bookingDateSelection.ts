export type SelectableBookingDate = {
  value: string;
  isCancelled: boolean;
};

export const resolveSelectedBookingDate = (
  selectableDates: SelectableBookingDate[],
  selectedDate: string,
  linkedBookingDate: string | null
): string => {
  if (linkedBookingDate) {
    const linkedSelectableDate = selectableDates.find(
      date => date.value === linkedBookingDate && !date.isCancelled
    );
    if (linkedSelectableDate) {
      return linkedBookingDate;
    }
  }

  if (!selectedDate || !selectableDates.some(date => date.value === selectedDate)) {
    return selectableDates.find(date => !date.isCancelled)?.value || '';
  }

  return selectedDate;
};
