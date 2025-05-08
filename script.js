document.addEventListener('DOMContentLoaded', function() {
    // --- Navigation et Scroll ---
    const navLinks = document.querySelectorAll('nav.main-nav a[href^="#"]'); // Cibler plus précisément les liens dans .main-nav
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = document.querySelector('header').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        });
    });

    // --- Année du Footer ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- État Actif Navigation au Scroll ---
    const sections = document.querySelectorAll('main section[id]');
    const header = document.querySelector('header'); // Stocker la référence au header
    let headerHeight = header ? header.offsetHeight : 0; // Obtenir la hauteur initiale

    // Mettre à jour la hauteur du header en cas de redimensionnement (si le header change de hauteur)
    window.addEventListener('resize', () => {
        headerHeight = header ? header.offsetHeight : 0;
    });
    
    function changeNavActiveState() {
        // S'assurer que headerHeight est à jour si le header n'était pas visible au chargement initial
        if (header && headerHeight === 0 && header.offsetHeight > 0) {
            headerHeight = header.offsetHeight;
        }

        let scrollY = window.pageYOffset + headerHeight + 60; // Seuil
        let کوئیفعاللنک = false; // Drapeau pour voir si un lien est activé

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop;
            let sectionId = current.getAttribute('id');
            const navLink = document.querySelector('nav.main-nav a[href="#' + sectionId + '"]'); // Cible .main-nav

            if (navLink) {
                if (scrollY >= sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                    کوئیفعاللنک = true;
                } else {
                    navLink.classList.remove('active');
                }
            }
        });

        // Si aucun lien n'est actif et qu'on est en haut, activer le premier
        const allNavLinks = document.querySelectorAll('nav.main-nav a'); // Tous les liens de la nav
        if (!کوئیفعاللنک && window.pageYOffset < sections[0].offsetTop - headerHeight - 10) {
            allNavLinks.forEach(link => link.classList.remove('active'));
            const firstLink = document.querySelector('nav.main-nav a[href="#hero"]');
            if (firstLink) firstLink.classList.add('active');
        }
    }
    window.addEventListener('scroll', changeNavActiveState);
    changeNavActiveState(); // Appel initial

    // --- Animation d'Apparition au Scroll ---
    const revealElements = document.querySelectorAll(
        '.about-content, .parcours-section, .contact-details, .single-release-card, .item-card'
    );
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
            // Optionnel : pour réinitialiser l'animation si l'élément sort de la vue
            // else {
            //     entry.target.style.opacity = '0';
            //     entry.target.style.transform = 'translateY(20px)';
            // }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        revealObserver.observe(el);
    });

    // --- LECTEURS AUDIO PERSONNALISÉS ---
    const audioPlayers = document.querySelectorAll('.audio-item');
    const activeAudioElements = {};
    const staticWaveformBars = {};

    audioPlayers.forEach(playerCard => {
        const playPauseButton = playerCard.querySelector('.play-pause-button');
        const waveformCanvas = playerCard.querySelector('.waveform-canvas');
        const currentTimeDisplay = playerCard.querySelector('.current-time');
        const durationTimeDisplay = playerCard.querySelector('.duration-time');
        const audioSrc = playPauseButton.dataset.src;
        const waveformContainer = playerCard.querySelector('.waveform-container');

        if (waveformCanvas && waveformContainer) {
            waveformCanvas.width = waveformContainer.offsetWidth > 0 ? waveformContainer.offsetWidth : 300;
            waveformCanvas.height = waveformContainer.offsetHeight > 0 ? waveformContainer.offsetHeight : 50;
        }

        if (!activeAudioElements[audioSrc]) {
            const newAudio = new Audio();
            newAudio.preload = "metadata";
            activeAudioElements[audioSrc] = newAudio;
        }
        const audio = activeAudioElements[audioSrc];

        if (!staticWaveformBars[audioSrc] && waveformCanvas) {
            staticWaveformBars[audioSrc] = generateStaticWaveformBars(waveformCanvas);
            drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], 0, 1);
        }

        function updateDisplayWhileLoading() {
            if (durationTimeDisplay) durationTimeDisplay.textContent = "--:--";
            if (currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
            if (waveformCanvas) {
                if (staticWaveformBars[audioSrc]) {
                     drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], 0, 1);
                } else {
                    // Fallback si generateStaticWaveformBars n'a pas encore été appelé (devrait l'être)
                    const ctx = waveformCanvas.getContext('2d');
                    ctx.clearRect(0,0,waveformCanvas.width, waveformCanvas.height);
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--light-text').trim();
                    ctx.font = `12px ${getComputedStyle(document.documentElement).getPropertyValue('--font-secondary').trim()}`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("Préparation...", waveformCanvas.width / 2, waveformCanvas.height / 2);
                }
            }
        }
        
        function updateAudioDisplay() {
            if (!audio.duration || isNaN(audio.duration)) {
                updateDisplayWhileLoading();
                return;
            }
            if (durationTimeDisplay) durationTimeDisplay.textContent = formatTime(audio.duration);
            if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audio.currentTime);
            
            if (staticWaveformBars[audioSrc] && waveformCanvas) {
                drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], audio.currentTime, audio.duration);
            }
        }

        if (audio.src !== new URL(audioSrc, window.location.href).href || audio.readyState < 2) {
            updateDisplayWhileLoading();
        } else {
            if (audio.readyState >= 2) {
                updateAudioDisplay();
            } else {
                updateDisplayWhileLoading();
            }
        }
        
        audio.addEventListener('loadedmetadata', () => {
            updateAudioDisplay();
            if (!staticWaveformBars[audioSrc] && waveformCanvas) {
                staticWaveformBars[audioSrc] = generateStaticWaveformBars(waveformCanvas);
                // Redessiner avec la durée correcte, même si currentTime est 0
                drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], audio.currentTime, audio.duration);
            }
        });

        audio.addEventListener('timeupdate', () => {
            updateAudioDisplay();
        });
        
        audio.addEventListener('error', (e) => {
            console.error("Erreur de chargement audio pour:", audioSrc, e);
            if (waveformCanvas) { /* Afficher un message d'erreur sur le canvas */ }
            if (playPauseButton) playPauseButton.disabled = true;
        });

        audio.addEventListener('play', () => {
            if (playPauseButton) playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        });

        audio.addEventListener('pause', () => {
            if (playPauseButton) playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
        });

        audio.addEventListener('ended', () => {
            if (playPauseButton) playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
            audio.currentTime = 0;
            if (staticWaveformBars[audioSrc] && waveformCanvas) {
                drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], 0, audio.duration);
            }
        });

        playPauseButton.addEventListener('click', () => {
            if (audio.src !== new URL(audioSrc, window.location.href).href) {
                audio.src = audioSrc;
                updateDisplayWhileLoading();
                audio.load();
            }
    
            if (audio.paused) {
                Object.values(activeAudioElements).forEach(otherAudioInstance => {
                    if (otherAudioInstance !== audio && !otherAudioInstance.paused) {
                        otherAudioInstance.pause();
                    }
                });
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Erreur lors de la tentative de lecture : ", error);
                        /* Afficher un message d'erreur sur le canvas */
                    });
                }
            } else {
                audio.pause();
            }
        });
        
        waveformContainer.addEventListener('click', (event) => {
            if (!audio.duration || audio.readyState < 2) return;
            const rect = waveformContainer.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const percent = clickX / rect.width;
            audio.currentTime = percent * audio.duration;
            if (staticWaveformBars[audioSrc] && waveformCanvas) {
                drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], audio.currentTime, audio.duration);
            }
        });
    });
    
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return "--:--";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function generateStaticWaveformBars(canvas) {
        if (!canvas) return [];
        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
             canvas.width = canvas.offsetWidth;
             canvas.height = canvas.offsetHeight;
        } else {
            canvas.width = 300; canvas.height = 50;
        }
        
        const width = canvas.width;
        const height = canvas.height;
        const barsData = [];
        const barWidth = 2;
        const gap = 1.5;
        const numBars = Math.max(1, Math.floor(width / (barWidth + gap)));

        for (let i = 0; i < numBars; i++) {
            const barHeight = Math.random() * (height * 0.7) + (height * 0.15);
            const y = (height - barHeight) / 2;
            const x = i * (barWidth + gap);
            barsData.push({ x, y, width: barWidth, height: barHeight });
        }
        return barsData;
    }
    
    function drawStaticWaveformProgress(canvas, barsData, currentTime, totalDuration) {
        if (!canvas || !barsData) return;
        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                 canvas.width = canvas.offsetWidth;
                 canvas.height = canvas.offsetHeight;
            }
        } else { return; }

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        ctx.clearRect(0, 0, width, canvas.height);

        const playedColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-played').trim();
        const unplayedColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-unplayed').trim();
        
        let progressX = 0;
        if (totalDuration > 0 && !isNaN(totalDuration)) {
            progressX = (currentTime / totalDuration) * width;
        }

        barsData.forEach(bar => {
            const barMidPointX = bar.x + bar.width / 2;
            ctx.fillStyle = barMidPointX < progressX ? playedColor : unplayedColor;
            ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        });
    }

    // --- GESTION DU MENU BURGER POUR MOBILE --- (Intégré ici)
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav'); // Assure-toi que ta <nav> a la classe "main-nav" dans ton HTML

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', function() {
            // console.log('Bouton burger cliqué !'); // Pour débogage
            mainNav.classList.toggle('nav-open');

            const icon = navToggle.querySelector('i');
            if (icon) {
                if (mainNav.classList.contains('nav-open')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                    navToggle.setAttribute('aria-label', 'Fermer le menu de navigation');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                    navToggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');
                }
            } else {
                console.error('Icône <i> non trouvée dans .nav-toggle. Assurez-vous d\'avoir Font Awesome et la balise <i>.');
            }
        });

        // Fermer le menu mobile quand un lien est cliqué
        const navLinksInMobileMenu = mainNav.querySelectorAll('a'); // Cible les liens DANS .main-nav
        navLinksInMobileMenu.forEach(link => {
            link.addEventListener('click', () => {
                // On ne ferme que si le menu est effectivement ouvert (visible sur mobile)
                if (mainNav.classList.contains('nav-open')) {
                    mainNav.classList.remove('nav-open');
                    const icon = navToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                        navToggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');
                    }
                }
            });
        });
    } else {
        if (!navToggle) console.error('Élément .nav-toggle non trouvé. Vérifiez votre HTML.');
        if (!mainNav) console.error('Élément .main-nav non trouvé. Vérifiez votre HTML.');
    }
    // (À ajouter dans ton script.js, dans DOMContentLoaded)

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Désactiver tous les boutons et contenus
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Activer le bouton cliqué et le contenu correspondant
        button.classList.add('active');
        const targetTab = button.dataset.tab;
        document.getElementById(targetTab).classList.add('active');
    });
});

}); // Fin de DOMContentLoaded principal