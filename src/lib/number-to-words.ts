const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const ordinalDays = [
  '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh',
  'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth',
  'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth',
  'Nineteenth', 'Twentieth', 'Twenty First', 'Twenty Second', 'Twenty Third',
  'Twenty Fourth', 'Twenty Fifth', 'Twenty Sixth', 'Twenty Seventh',
  'Twenty Eighth', 'Twenty Ninth', 'Thirtieth', 'Thirty First'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function convertNumberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + convertNumberToWords(Math.abs(num));

  let words = '';

  if (Math.floor(num / 10000000) > 0) {
    words += convertNumberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }

  if (Math.floor(num / 100000) > 0) {
    words += convertNumberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }

  if (Math.floor(num / 1000) > 0) {
    words += convertNumberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    words += convertNumberToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }

  if (num > 0) {
    if (words !== '') words += 'and ';
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += ' ' + ones[num % 10];
      }
    }
  }

  return words.trim();
}

export function convertDateToWords(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    const dayWord = ordinalDays[day] || convertNumberToWords(day);
    const monthWord = months[month];
    const yearWord = convertNumberToWords(year);

    return `${dayWord} ${monthWord} ${yearWord}`.replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}
