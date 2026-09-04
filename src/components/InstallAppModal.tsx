import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Share2, 
  PlusSquare, 
  Download, 
  X, 
  Check, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Layers,
  Zap
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect Standalone Mode (already installed as PWA)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Capture Android/Desktop PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FDFCFB] border border-amber-900/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-amber-100 tracking-wide">
                Установка на телефон
              </h3>
              <p className="text-xs text-amber-200/80">
                Запуск в полноэкранном режиме как нативное приложение
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-amber-200/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status message if already installed */}
          {isStandalone ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 text-sm">Приложение уже установлено!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Вы уже запустили приложение в автономном режиме без адресной строки браузера.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* App Card Preview */}
              <div className="flex items-center gap-4 p-3.5 bg-amber-500/10 border border-amber-800/15 rounded-xl">
                <img 
                  src="/icon.svg" 
                  alt="App Icon" 
                  className="w-14 h-14 rounded-xl shadow-md border border-amber-900/10 shrink-0" 
                />
                <div>
                  <div className="font-display font-bold text-slate-900 text-base">
                    Ἑλληνική Κοινή
                  </div>
                  <div className="text-xs text-slate-600">
                    Изучение библейского греческого языка
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 text-amber-700" /> PWA Standalone
                    </span>
                    <span className="text-[11px] text-slate-500">Без App Store / Google Play</span>
                  </div>
                </div>
              </div>

              {/* Direct 1-tap install if supported (Chrome/Android) */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" />
                  Установить в 1 клик на это устройство
                </button>
              )}

              {installSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Запрос отправлен! Иконка добавлена на ваш рабочий стол.
                </div>
              )}

              {/* Instructions tabs / guides */}
              <div className="space-y-4 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isIOS ? 'Инструкция для iPhone & iPad (Safari)' : isAndroid ? 'Инструкция для Android (Chrome / Яндекс)' : 'Пошаговая инструкция для телефонов'}
                </div>

                {/* iOS Instructions */}
                {(isIOS || (!isIOS && !isAndroid)) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white/80 space-y-3">
                    <div className="flex items-center gap-2 font-medium text-slate-800 text-sm">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">iOS</span>
                      <span>На iPhone / iPad (через браузер Safari):</span>
                    </div>

                    <ol className="space-y-2.5 text-xs text-slate-700 pl-1">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <div>
                          Откройте ссылку в <strong>Safari</strong> и нажмите кнопку <strong>«Поделиться»</strong> <Share2 className="w-3.5 h-3.5 inline text-blue-600 ml-0.5 align-text-bottom" /> (квадрат со стрелкой вверх внизу экрана).
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <div>
                          Прокрутите список действий вниз и нажмите <strong>«На экран «Домой»»</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 ml-0.5 align-text-bottom" />.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <div>
                          В правом верхнем углу нажмите <strong>«Добавить»</strong>.
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {/* Android Instructions */}
                {(isAndroid || (!isIOS && !isAndroid)) && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white/80 space-y-3">
                    <div className="flex items-center gap-2 font-medium text-slate-800 text-sm">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs flex items-center justify-center font-bold">Android</span>
                      <span>На смартфонах Android (Chrome / Браузер):</span>
                    </div>

                    <ol className="space-y-2.5 text-xs text-slate-700 pl-1">
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <div>
                          Нажмите кнопку <strong>меню ⋮ (три точки)</strong> в правом верхнем углу браузера.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <div>
                          Выберите пункт <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <div>
                          Подтвердите добавление. Иконка появится в меню ваших приложений!
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {/* Benefits */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Преимущества нативного режима:
                  </div>
                  <ul className="space-y-1 pl-4 list-disc marker:text-amber-600">
                    <li>Никакой адресной строки и рамок браузера (100% полезной площади экрана).</li>
                    <li>Мгновенный запуск прямо с иконки на рабочем столе.</li>
                    <li>Сохранение всех сессий, настроек и результатов обучения.</li>
                    <li>Поддержка полноэкранного интерфейса и греческой виртуальной клавиатуры.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
