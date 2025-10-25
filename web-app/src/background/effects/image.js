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

// Функция для преобразования объекта в текст с разными размерами шрифта и пробелами
function employeeDataToTextWithFontSizes(employeeData) {
  const privacyLevel = employeeData.privacy_level;

  switch (privacyLevel) {
    case 'high':
      return [
        { text: employeeData.full_name, fontSize: '45px', spacingAfter: 0 },
        { text: employeeData.position, fontSize: '43px', spacingAfter: 0 }
      ];

    case 'medium':
      return [
        { text: employeeData.full_name, fontSize: '40px', spacingAfter: 0 },
        { text: employeeData.position, fontSize: '38px', spacingAfter: 20 }, // пробел после блока имени/должности
        { text: employeeData.company, fontSize: '23px', spacingAfter: 0 },
        { text: employeeData.department, fontSize: '23px', spacingAfter: 0 },
        { text: employeeData.office_location, fontSize: '23px', spacingAfter: 15 }, // пробел после блока компании/отдела
      ];

    case 'low':
      return [
        { text: employeeData.full_name, fontSize: '40px', spacingAfter: 0 },
        { text: employeeData.position, fontSize: '40px', spacingAfter: 20 }, // пробел после блока имени/должности
        { text: employeeData.company, fontSize: '23px', spacingAfter: 0 },
        { text: employeeData.department, fontSize: '23px', spacingAfter: 0 },
        { text: employeeData.office_location, fontSize: '23px', spacingAfter: 15 }, // пробел после блока компании/отдела
        { text: `Email: ${employeeData.contact.email}`, fontSize: '25px', spacingAfter: 0 },
        { text: `Telegram: ${employeeData.contact.telegram}`, fontSize: '25px', spacingAfter: 0 }, // пробел после блока контактов
        { text: employeeData.branding.slogan, fontSize: '25px', spacingAfter: 0 }
      ];

    default:
      return [
        { text: employeeData.full_name, fontSize: '27px', spacingAfter: 0 },
        { text: employeeData.position, fontSize: '27px', spacingAfter: 10 },
        { text: employeeData.company, fontSize: '23px', spacingAfter: 0 },
        { text: employeeData.department, fontSize: '23px', spacingAfter: 0 },
        { text: employeeData.office_location, fontSize: '23px', spacingAfter: 0 },
      ];
  }
}

// Функция для получения настроек текста в зависимости от уровня приватности
function getTextSettings(privacyLevel) {
  switch (privacyLevel) {
    case 'high':
      return {
        lineHeight: 45,
        startY: 20,
        strokeWidth: 3
      };

    case 'medium':
      return {
        lineHeight: 35,
        startY: 30,
        strokeWidth: 3
      };

    case 'low':
      return {
        lineHeight: 35,
        startY: 20,
        strokeWidth: 2
      };

    default:
      return {
        lineHeight: 40,
        startY: 30,
        strokeWidth: 3
      };
  }
}

export class ImageBackground extends BackgroundEffect {

    constructor(image = null, mode = 'stretch', privacyLevel = 'medium') {
        super();
        this.image = image;
        this.mode = mode;
        this.privacyLevel = privacyLevel; // Сохраняем privacyLevel
    }

    makeBackgroundTo(frameWidth, frameHeight) {
        const h = frameHeight;
        const w = frameWidth;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // --- Отрисовка фонового изображения ---
        switch (this.mode) {
            case 'stretch':
                ctx.drawImage(this.image, 0, 0, w, h);
                break;

            case 'fill':
                const ih = this.image.naturalHeight || this.image.height;
                const iw = this.image.naturalWidth || this.image.width;

                const scale = Math.max(w / iw, h / ih);
                const nw = iw * scale;
                const nh = ih * scale;

                const x0 = (nw - w) / 2;
                const y0 = (nh - h) / 2;

                ctx.drawImage(
                    this.image,
                    x0, y0, w, h,
                    0, 0, w, h
                );
                break;
            default:
                console.warn(`Unknown image mode: ${this.mode}. Using 'stretch' as fallback.`);
                ctx.drawImage(this.image, 0, 0, w, h);
                break;
        }

        // --- Парсинг текста с файла json с использованием privacyLevel ---
        const employeeData = parseEmployeeData(textData, this.privacyLevel);

        // --- Преобразуем объект в текст с разными размерами шрифта ---
        const textLines = employeeDataToTextWithFontSizes(employeeData);

        // --- Получаем настройки текста для текущего уровня приватности ---
        const textSettings = getTextSettings(this.privacyLevel);

        // --- Настройки базового текста ---
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = textSettings.strokeWidth;

        // --- Отрисовка многострочного текста с разными размерами шрифта и пробелами ---
        const startX = 20;
        let currentY = textSettings.startY;

        textLines.forEach((lineObj) => {
          // Устанавливаем размер шрифта для текущей строки
          ctx.font = `bold ${lineObj.fontSize} 'Segoe UI'`;

          // Отрисовываем текст с обводкой и заливкой
          ctx.strokeText(lineObj.text, startX, currentY);
          ctx.fillText(lineObj.text, startX, currentY);

          // Переходим к следующей строке, добавляем дополнительный пробел если нужно
          currentY += textSettings.lineHeight;

          // Добавляем дополнительный пробел после строки, если указано
          if (lineObj.spacingAfter > 0) {
            currentY += lineObj.spacingAfter;
          }
        });

        return canvas;
    }
}
export default ImageBackground;
