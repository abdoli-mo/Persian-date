/**
 * پروتوتایپ توسعه یافته Date برای پشتیبانی کامل از تاریخ شمسی
 * با رعایت استانداردهای جاوااسکریپت و پشتیبانی از تمام موارد
 */
const PersianDatePrototype = {
  // ==================== متدهای اصلی ====================
  /**
   * دریافت روز شمسی (1-31)
   * @returns {number}
   */
  getPersianDay() {
    return this._getPersianParts()[2];
  },

  /**
   * دریافت ماه شمسی (1-12)
   * @returns {number}
   */
  getPersianMonth() {
    return this._getPersianParts()[1];
  },

  /**
   * دریافت سال شمسی کامل
   * @returns {number}
   */
  getPersianFullYear() {
    return this._getPersianParts()[0];
  },

  // ==================== متدهای کمکی ====================
  /**
   * دریافت روز هفته شمسی (1=شنبه تا 7=جمعه)
   * @returns {number}
   */
  getPersianWeekday() {
    return (this.getDay() + 1) % 7 + 1;
  },

  /**
   * دریافت نام روز هفته
   * @returns {string}
   */
  getPersianWeekdayName() {
    const weekDayNames = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", 
                         "چهارشنبه", "پنج‌شنبه", "جمعه"];
    return weekDayNames[this.getPersianWeekday() - 1];
  },

  /**
   * دریافت نام ماه شمسی
   * @returns {string}
   */
  getPersianMonthName() {
    const monthNames = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    return monthNames[this.getPersianMonth() - 1];
  },

  /**
   * بررسی سال کبیسه شمسی
   * @param {number} [year] - سال مورد نظر (اختیاری)
   * @returns {boolean}
   */
  isPersianLeapYear(year = this.getPersianFullYear()) {
    const remainder = (year - (year > 979 ? 979 : 0)) % 33;
    return [1, 5, 9, 13, 17, 22, 26, 30].includes(remainder);
  },

  // ==================== متدهای فرمت‌دهی ====================
  /**
   * فرمت استاندارد تاریخ شمسی
   * @returns {string}
   */
  toPersianDateString() {
    return `${this.getPersianWeekdayName()} ${this.getPersianDay()} ${this.getPersianMonthName()} ${this.getPersianFullYear()}`;
  },

  /**
   * فرمت کوتاه تاریخ شمسی (YYYY/MM/DD)
   * @returns {string}
   */
  toShortPersianDate() {
    return this._formatPersianDate('yyyy/mm/dd');
  },

  /**
   * فرمت ISO تاریخ شمسی (YYYY-MM-DD)
   * @returns {string}
   */
  toPersianISOString() {
    return this._formatPersianDate('yyyy-mm-dd');
  },

  /**
   * فرمت‌دهی پویا تاریخ شمسی
   * @param {string} format - الگوی فرمت‌دهی
   * @returns {string}
   */
  formatPersianDate(format = 'yyyy/mm/dd') {
    const replacements = {
      'yyyy': this.getPersianFullYear().toString(),
      'yy': (this.getPersianFullYear() % 100).toString().padStart(2, '0'),
      'MMMM': this.getPersianMonthName(),
      'MMM': this.getPersianMonthName().substring(0, 3),
      'mm': this.getPersianMonth().toString().padStart(2, '0'),
      'm': this.getPersianMonth().toString(),
      'dd': this.getPersianDay().toString().padStart(2, '0'),
      'd': this.getPersianDay().toString(),
      'DDDD': this.getPersianWeekdayName(),
      'DDD': this.getPersianWeekdayName().substring(0, 3),
      'D': this.getPersianWeekday().toString()
    };

    return Object.entries(replacements).reduce(
      (str, [key, val]) => str.replace(new RegExp(key, 'g'), val),
      format
    );
  },

  // ==================== متدهای تبدیل ====================
  /**
   * تنظیم تاریخ شمسی
   * @param {number} year - سال شمسی
   * @param {number} month - ماه شمسی (1-12)
   * @param {number} day - روز شمسی
   * @param {boolean} [keepTime=false] - حفظ زمان فعلی
   * @returns {Date}
   */
  setPersianDate(year, month, day, keepTime = false) {
    // اعتبارسنجی نوع
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      throw new TypeError("پارامترها باید عدد باشند");
    }

    // اعتبارسنجی محدوده ماه
    if (month < 1 || month > 12) {
      throw new RangeError("ماه باید بین 1 تا 12 باشد");
    }

    // اعتبارسنجی محدوده روز
    const maxDay = month <= 6 ? 31 : 
                  month <= 11 ? 30 : 
                  this.isPersianLeapYear(year) ? 30 : 29;
    
    if (day < 1 || day > maxDay) {
      throw new RangeError(`روز برای ماه ${month} باید بین 1 تا ${maxDay} باشد`);
    }

    // تبدیل به میلادی
    const gDate = this._persianToGregorian(year, month, day);
    this.setFullYear(gDate.year, gDate.month - 1, gDate.day);
    
    if (!keepTime) {
      this.setHours(0, 0, 0, 0);
    }
    
    this._clearCache();
    return this;
  },

  // ==================== متدهای کمکی داخلی ====================
  /**
   * تبدیل تاریخ میلادی به شمسی و کش کردن نتیجه
   * @private
   * @returns {number[]}
   */
  _getPersianParts() {
    if (!this._persianPartsCache) {
      this._persianPartsCache = this._gregorianToPersian(
        this.getFullYear(),
        this.getMonth() + 1,
        this.getDate()
      );
    }
    return this._persianPartsCache;
  },

  /**
   * تبدیل تاریخ شمسی به میلادی
   * @private
   * @param {number} year - سال شمسی
   * @param {number} month - ماه شمسی
   * @param {number} day - روز شمسی
   * @returns {Object}
   */
  _persianToGregorian(year, month, day) {
    // الگوریتم تبدیل با دقت بالا
    let gregorianYear = year <= 979 ? 621 : 1600;
    year -= year <= 979 ? 0 : 979;
    
    let days = (365 * year) + 
              Math.floor(year / 33) * 8 + 
              Math.floor((year % 33 + 3) / 4) +
              78 + day + 
              (month < 7 ? (month - 1) * 31 : (month - 7) * 30 + 186);
    
    gregorianYear += 400 * Math.floor(days / 146097);
    days %= 146097;
    
    if (days > 36524) {
      gregorianYear += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    
    gregorianYear += 4 * Math.floor(days / 1461);
    days %= 1461;
    gregorianYear += Math.floor((days - 1) / 365);
    
    if (days > 365) days = (days - 1) % 365;
    
    let gregorianDay = days + 1;
    const monthDays = [
      0, 31, 
      (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || 
      (gregorianYear % 400 === 0) ? 29 : 28,
      31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ];
    
    let gregorianMonth;
    for (gregorianMonth = 1; gregorianMonth < 13; gregorianMonth++) {
      if (gregorianDay <= monthDays[gregorianMonth]) break;
      gregorianDay -= monthDays[gregorianMonth];
    }
    
    return {
      year: gregorianYear,
      month: gregorianMonth,
      day: gregorianDay
    };
  },

  /**
   * تبدیل تاریخ میلادی به شمسی
   * @private
   * @param {number} year - سال میلادی
   * @param {number} month - ماه میلادی
   * @param {number} day - روز میلادی
   * @returns {number[]}
   */
  _gregorianToPersian(year, month, day) {
    const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let persianYear = year <= 1600 ? 0 : 979;
    const adjustedYear = year <= 1600 ? year - 621 : year - 1600;
    const year2 = month > 2 ? adjustedYear + 1 : adjustedYear;
    
    let days = (365 * adjustedYear) + 
              Math.floor((year2 + 3) / 4) - 
              Math.floor((year2 + 99) / 100) +
              Math.floor((year2 + 399) / 400) - 
              80 + day + monthDays[month - 1];
    
    persianYear += 33 * Math.floor(days / 12053);
    days %= 12053;
    persianYear += 4 * Math.floor(days / 1461);
    days %= 1461;
    persianYear += Math.floor((days - 1) / 365);
    
    if (days > 365) days = (days - 1) % 365;
    
    const persianMonth = days < 186 ? 
      1 + Math.floor(days / 31) : 
      7 + Math.floor((days - 186) / 30);
    
    const persianDay = 1 + (
      days < 186 ? days % 31 : (days - 186) % 30
    );
    
    return [persianYear, persianMonth, persianDay];
  },

  /**
   * پاک کردن کش محاسبات
   * @private
   */
  _clearCache() {
    delete this._persianPartsCache;
  },

  // ==================== متدهای کمکی عمومی ====================
  /**
   * اضافه کردن روز به تاریخ
   * @param {number} days - تعداد روز برای اضافه کردن
   * @returns {Date}
   */
  addDays(days) {
    const date = new Date(this);
    date.setDate(date.getDate() + days);
    return date;
  },

  /**
   * دریافت تاریخ بدون زمان
   * @returns {Date}
   */
  getDateWithoutTime() {
    const date = new Date(this);
    date.setHours(0, 0, 0, 0);
    return date;
  }
};

// ==================== الحاق به پروتوتایپ Date ====================
Object.assign(Date.prototype, PersianDatePrototype);

// ==================== بازنویسی متدهای تغییردهنده تاریخ ====================
['setDate', 'setMonth', 'setFullYear', 'setHours', 'setMinutes', 'setSeconds', 'setMilliseconds']
  .forEach(method => {
    const original = Date.prototype[method];
    Date.prototype[method] = function(...args) {
      this._clearCache();
      return original.apply(this, args);
    };
  });

// ==================== متدهای استاتیک ====================
/**
 * بررسی اعتبار تاریخ شمسی
 * @param {number} year - سال شمسی
 * @param {number} month - ماه شمسی
 * @param {number} day - روز شمسی
 * @returns {boolean}
 */
Date.isValidPersianDate = function(year, month, day) {
  try {
    new Date().setPersianDate(year, month, day);
    return true;
  } catch {
    return false;
  }
};

/**
 * ایجاد تاریخ از رشته شمسی
 * @param {string} dateString - رشته تاریخ (فرمت: YYYY/MM/DD)
 * @param {string} [separator='/'] - جداکننده
 * @returns {Date}
 */
Date.fromPersianDate = function(dateString, separator = '/') {
  const parts = dateString.split(separator).map(part => {
    const num = parseInt(part, 10);
    if (isNaN(num)) throw new Error("فرمت تاریخ نامعتبر");
    return num;
  });
  
  if (parts.length !== 3) throw new Error("فرمت تاریخ نامعتبر");
  
  const date = new Date();
  date.setPersianDate(parts[0], parts[1], parts[2]);
  return date;
};
