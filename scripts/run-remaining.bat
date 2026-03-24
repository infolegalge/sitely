@echo off
chcp 437 >nul
echo Starting remaining screenshot downloads (17 left)...

call :shot crust-bakery https://www.epicurious.com
call :shot ember-safari https://www.expedia.com
call :shot kinetic-physio https://www.everydayhealth.com
call :shot noma-cocktails https://www.thekitchn.com
call :shot pinnacle-towers https://www.zillow.com
call :shot pixel-forge https://www.figma.com
call :shot quantum-consulting https://www.accenture.com
call :shot sakana-omakase https://www.eater.com
call :shot sakura-ryokan https://www.nationalgeographic.com/travel
call :shot serenity-wellness https://www.healthline.com
call :shot soleil-eyewear https://www.farfetch.com
call :shot sonance-music https://www.sketch.com
call :shot urban-nest https://www.realtor.com
call :shot vanguard-menswear https://www.vogue.com
call :shot verde-kitchen https://www.seriouseats.com
call :shot wanderlust-trails https://www.lonelyplanet.com
call :shot zenith-law https://www.weforum.org

echo.
echo All done!
goto :eof

:shot
echo [%TIME%] Processing %1...
node scripts/screenshot-one.mjs %1 %2
echo [%TIME%] Finished %1
goto :eof
