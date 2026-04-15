import React from 'react';

const SiteFooter: React.FC = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold">Контактная информация</h5>
          <p className="mb-1">
            Email:{' '}
            <a href="mailto:contact@golosovalka.ru" className="text-white text-decoration-underline">
              contact@golosovalka.ru
            </a>
          </p>
          <p className="mb-0">
            Телефон:{' '}
            <a href="tel:+79991234567" className="text-white text-decoration-underline">
              +7 (999) 123-45-67
            </a>
          </p>
        </div>

        <div className="mt-3 mt-md-0 d-flex align-items-center gap-3">
          <a href="https://t.me/" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Telegram_Messenger.png"
              alt=""
              width={32}
              height={32}
              style={{ filter: 'invert(1)' }}
            />
          </a>
          <a href="https://vk.com/chupkevichus" target="_blank" rel="noopener noreferrer" aria-label="VK">
            <img
              src="https://pngicon.ru/file/uploads/vk.png"
              alt=""
              width={32}
              height={32}
              style={{ filter: 'invert(1)' }}
            />
          </a>
          <a href="https://github.com/F4aming" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <img
              src="https://cdn-icons-png.flaticon.com/512/733/733553.png"
              alt=""
              width={32}
              height={32}
              style={{ filter: 'invert(1)' }}
            />
          </a>
        </div>
      </div>

      <div className="text-center mt-3">
        <small>&copy; {new Date().getFullYear()} Голосовалка. Все права защищены.</small>
      </div>
    </footer>
  );
};

export default SiteFooter;
