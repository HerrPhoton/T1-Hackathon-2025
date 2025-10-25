import { BackgroundEffect } from './base';
import textData from '../../assets/examples/example.json';

// Функция теперь принимает privacyLevel как параметр
function parseEmployeeData(data, privacyLevel = 'medium') {
  const employee = data.employee;

  // Базовые данные, доступные на всех уровнях
  const result = {
    full_name: employee.full_name,
    position: employee.position,
    company: employee.company,
    privacy_level: privacyLevel
  };

  // Данные в зависимости от уровня приватности
  switch (privacyLevel) {
    case 'high':
      // Минимальная информация - только имя и должность
      return {
        full_name: employee.full_name,
        position: employee.position,
        privacy_level: privacyLevel
      };

    case 'medium':
      // Средняя информация - добавляем отдел и контакты
      return {
        ...result,
        department: employee.department,
        office_location: employee.office_location,
        contact: {
          email: employee.contact.email
        }
      };

    case 'low':
      // Полная информация
      return {
        ...result,
        department: employee.department,
        office_location: employee.office_location,
        contact: {
          email: employee.contact.email,
          telegram: employee.contact.telegram
        },
        branding: {
          logo_url: employee.branding.logo_url,
          corporate_colors: employee.branding.corporate_colors,
          slogan: employee.branding.slogan
        }
      };

    default:
      return {
        ...result,
        department: employee.department,
        office_location: employee.office_location,
        contact: {
          email: employee.contact.email
        }
      };
  }
}

// Функция для расчета базового размера шрифта в зависимости от разрешения
function calculateBaseFontSize(frameWidth, frameHeight) {
  // Базовое разрешение для расчета (1920x1080)
  const baseWidth = 1920;
  const baseHeight = 1080;

  // Используем минимальную сторону для расчета, чтобы шрифт был читаемым на любом разрешении
  const minDimension = Math.min(frameWidth, frameHeight);
  const baseMinDimension = Math.min(baseWidth, baseHeight);

  // Коэффициент масштабирования (0.5-2.0)
  const scaleFactor = minDimension / baseMinDimension;

  // Базовый размер шрифта для 1080p
  const baseFontSize = 24;

  // Рассчитываем адаптивный размер шрифта
  return Math.max(12, Math.min(48, baseFontSize * scaleFactor));
}

// Функция для преобразования объекта в текст с адаптивными размерами шрифта
function employeeDataToTextWithFontSizes(employeeData, frameWidth, frameHeight) {
  const privacyLevel = employeeData.privacy_level;
  const baseFontSize = calculateBaseFontSize(frameWidth, frameHeight);

  // Коэффициенты для разных типов текста
  const nameMultiplier = 1.8;      // Имя - самый крупный
  const positionMultiplier = 1.6;  // Должность - крупный
  const companyMultiplier = 1.0;   // Компания - средний
  const contactMultiplier = 0.9;   // Контакты - мелкий
  const sloganMultiplier = 0.8;    // Слоган - самый мелкий

  switch (privacyLevel) {
    case 'high':
      return [
        {
          text: employeeData.full_name,
          fontSize: Math.round(baseFontSize * nameMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.position,
          fontSize: Math.round(baseFontSize * positionMultiplier),
          spacingAfter: 0
        }
      ];

    case 'medium':
      return [
        {
          text: employeeData.full_name,
          fontSize: Math.round(baseFontSize * nameMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.position,
          fontSize: Math.round(baseFontSize * positionMultiplier),
          spacingAfter: Math.round(baseFontSize * 0.8)
        },
        {
          text: employeeData.company,
          fontSize: Math.round(baseFontSize * companyMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.department,
          fontSize: Math.round(baseFontSize * companyMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.office_location,
          fontSize: Math.round(baseFontSize * companyMultiplier),
          spacingAfter: Math.round(baseFontSize * 0.6)
        },
      ];

    case 'low':
      return [
        {
          text: employeeData.full_name,
          fontSize: Math.round(baseFontSize * nameMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.position,
          fontSize: Math.round(baseFontSize * positionMultiplier),
          spacingAfter: Math.round(baseFontSize * 0.8)
        },
        {
          text: employeeData.company,
          fontSize: Math.round(baseFontSize * companyMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.department,
          fontSize: Math.round(baseFontSize * companyMultiplier),
          spacingAfter: 0
        },
        {
          text: employeeData.office_location,
          fontSize: Math.round(baseFontSize * companyMultiplier),
          spacingAfter: Math.round(baseFontSize * 0.6)
        },
        {
          text: `Email: ${employeeData.contact.email}`,
          fontSize: Math.round(baseFontSize * contactMultiplier),
          spacingAfter: 0
        },
        {
          text: `Telegram: ${employeeData.contact.telegram}`,
          fontSize: Math.round(baseFontSize * contactMultiplier),
          spacingAfter: Math.round(baseFontSize * 0.4)
        },
        {
          text: employeeData.branding.slogan,
          fontSize: Math.round(baseFontSize * sloganMultiplier),
          spacingAfter: 0
        }
      ];

    default:
      return [
        {
          text: employeeData.full_name,
          fontSize: Math.round(baseFontSize * 1.2),
          spacingAfter: 0
        },
        {
          text: employeeData.position,
          fontSize: Math.round(baseFontSize * 1.2),
          spacingAfter: Math.round(baseFontSize * 0.4)
        },
        {
          text: employeeData.company,
          fontSize: Math.round(baseFontSize * 1.0),
          spacingAfter: 0
        },
        {
          text: employeeData.department,
          fontSize: Math.round(baseFontSize * 1.0),
          spacingAfter: 0
        },
        {
          text: employeeData.office_location,
          fontSize: Math.round(baseFontSize * 1.0),
          spacingAfter: 0
        },
      ];
  }
}

// Функция для получения адаптивных настроек текста
function getTextSettings(privacyLevel, frameWidth, frameHeight) {
  const baseFontSize = calculateBaseFontSize(frameWidth, frameHeight);

  switch (privacyLevel) {
    case 'high':
      return {
        lineHeight: Math.round(baseFontSize * 1.8),
        startY: Math.round(baseFontSize * 0.8),
        strokeWidth: Math.max(1, Math.round(baseFontSize * 0.1))
      };

    case 'medium':
      return {
        lineHeight: Math.round(baseFontSize * 1.4),
        startY: Math.round(baseFontSize * 1.2),
        strokeWidth: Math.max(1, Math.round(baseFontSize * 0.1))
      };

    case 'low':
      return {
        lineHeight: Math.round(baseFontSize * 1.3),
        startY: Math.round(baseFontSize * 0.8),
        strokeWidth: Math.max(1, Math.round(baseFontSize * 0.08))
      };

    default:
      return {
        lineHeight: Math.round(baseFontSize * 1.5),
        startY: Math.round(baseFontSize * 1.2),
        strokeWidth: Math.max(1, Math.round(baseFontSize * 0.1))
      };
  }
}

export class SolidColorBackground extends BackgroundEffect {

  constructor(color = '#1e1e1e', privacyLevel = 'medium') {
    super();
    this.color = color;
    this.privacyLevel = privacyLevel; // Сохраняем privacyLevel
  }

  makeBackgroundTo(frameWidth, frameHeight) {
    const c = document.createElement('canvas');
    c.width = frameWidth;
    c.height = frameHeight;

    const ctx = c.getContext('2d');

    console.log(`📐 Разрешение фона: ${frameWidth}x${frameHeight}, Базовый размер шрифта: ${calculateBaseFontSize(frameWidth, frameHeight)}px`);

    // --- СНАЧАЛА рисуем фон ---
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, frameWidth, frameHeight);

    // --- ПОТОМ рисуем текст ПОВЕРХ фона ---
    const employeeData = parseEmployeeData(textData, this.privacyLevel);
    const textLines = employeeDataToTextWithFontSizes(employeeData, frameWidth, frameHeight);
    const textSettings = getTextSettings(this.privacyLevel, frameWidth, frameHeight);

    // Настройки текста
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = textSettings.strokeWidth;

    // Отрисовка многострочного текста
    const startX = Math.round(frameWidth * 0.02); // 2% от ширины
    let currentY = textSettings.startY;

    textLines.forEach((lineObj, index) => {
      ctx.font = `bold ${lineObj.fontSize}px 'Segoe UI', Arial, sans-serif`;

      // Сначала рисуем обводку для лучшей читаемости
      ctx.strokeText(lineObj.text, startX, currentY);
      // Затем рисуем основной текст
      ctx.fillText(lineObj.text, startX, currentY);

      console.log(`📝 Строка ${index + 1}: "${lineObj.text}" - размер: ${lineObj.fontSize}px`);

      currentY += textSettings.lineHeight;

      if (lineObj.spacingAfter > 0) {
        currentY += lineObj.spacingAfter;
      }
    });

    return c;
  }
}

// Вспомогательная функция для отладки
export function getFontSizeInfo(frameWidth, frameHeight) {
  const baseFontSize = calculateBaseFontSize(frameWidth, frameHeight);
  return {
    frameWidth,
    frameHeight,
    baseFontSize,
    calculatedSizes: {
      name: Math.round(baseFontSize * 1.8),
      position: Math.round(baseFontSize * 1.6),
      company: Math.round(baseFontSize * 1.0),
      contact: Math.round(baseFontSize * 0.9),
      slogan: Math.round(baseFontSize * 0.8)
    }
  };
}

export default SolidColorBackground;
