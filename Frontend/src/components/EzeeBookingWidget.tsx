import React, { useEffect, useState } from 'react';
import { BOOKING_CONFIG } from '../config/bookingConfig';
import { loadEzeeBookingResources } from '../utils/bookingScriptLoader';

interface EzeeBookingWidgetProps {
  className?: string;
}

export const EzeeBookingWidget: React.FC<EzeeBookingWidgetProps> = ({ className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadEzeeBookingResources()
      .then(() => {
        if (!isMounted) return;
        setIsLoaded(true);

        // Initialize official EZEE booking widget with jQuery
        setTimeout(() => {
          if ((window as any).jQuery && (window as any).jQuery.fn && (window as any).jQuery.fn.bb_resBookingBox) {
            try {
              (window as any).jQuery('#bb_resBookingBox').bb_resBookingBox(BOOKING_CONFIG.widgetOptions);
            } catch (err) {
              console.warn('EZEE widget initialization warning:', err);
            }
          }
        }, 100);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('EZEE Booking Widget failed to load:', err);
        setError('Unable to load booking engine widget.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={`ezee-booking-widget-container ${className}`}>
      {error ? (
        <div className="text-red-500 text-sm text-center py-2">{error}</div>
      ) : !isLoaded ? (
        <div className="text-ivory/80 text-sm text-center py-4 animate-pulse">
          Loading Booking Engine...
        </div>
      ) : null}

      <div className="outerbewrap">
        <div className="bewarp">
          <form
            style={{ margin: '0px' }}
            action={BOOKING_CONFIG.bookingUrl}
            method="post"
            name="_resBBBox"
            target="_blank"
          >
            <div id="bb_resBookingBox" className="bb_resbox">
              &nbsp;
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .bewarp { position: relative; width: 100%; text-align: center; z-index: 0; bottom: 0px; border-radius: 6px; }
        .bb_resbox { width: initial !important; display: inline-block; text-align: center; padding: 10px 10px 20px 10px; }
        .bb_resbox label { color: #fff; font-size: 14px; height: initial; }
        .bb_resbox input[type="text"] { margin: 0px !important; font-size: 14px; min-width: 100%; line-height: 26px; box-sizing: border-box; height: initial; }
        .bb_resbox select { line-height: 26px; height: initial; }
        .bb_resbox button.ui-datepicker-trigger { margin: 0px; padding: 0px; }
        input[type="button"]#bb_resBtn, input#bb_resBtn { margin-bottom: 0px; -webkit-appearance: none; border-radius: 0; line-height: 26px; font-weight: bold; }
        #bb_resBtn:hover { color: #fff !important; background: #cd8a0a !important; border: 1px solid #cd8a0a !important; }
        .ui-datepicker .ui-datepicker-title select { display: inline-block; max-width: 76px; min-width: 76px; }
        @media only screen and (max-width: 752px) { .bewarp { position: static; min-width: 100%; } }
        @media only screen and (max-width: 415px) {
          .bb_resbox p { width: 100%; box-sizing: border-box; }
          .bb_resbox input[type="text"] { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default EzeeBookingWidget;
