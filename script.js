document.addEventListener('DOMContentLoaded', function() {
    // --- Navigation et Scroll --- (INCHANGÉ)
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
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

    // --- Année du Footer --- (INCHANGÉ)
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- État Actif Navigation au Scroll --- (INCHANGÉ)
    const sections = document.querySelectorAll('main section[id]');
    const headerHeight = document.querySelector('header').offsetHeight;
    function changeNavActiveState() {
        let scrollY = window.pageYOffset + headerHeight + 60;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop;
            let sectionId = current.getAttribute('id');
            const navLink = document.querySelector('nav a[href="#' + sectionId + '"]');
            if (navLink) {
                if (scrollY >= sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
        if (window.pageYOffset < sections[0].offsetTop - headerHeight - 10) {
            navLinks.forEach(link => link.classList.remove('active'));
            const firstLink = document.querySelector('nav a[href="#hero"]');
            if (firstLink) firstLink.classList.add('active');
        }
    }
    window.addEventListener('scroll', changeNavActiveState);
    changeNavActiveState();

    // --- Animation d'Apparition au Scroll --- (INCHANGÉ)
    const revealElements = document.querySelectorAll(
        '.about-content, .parcours-section, .contact-details, .single-release-card, .item-card'
    );
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        revealObserver.observe(el);
    });

    // --- LECTEURS AUDIO PERSONNALISÉS (SIMPLIFIÉS) ---
    const audioPlayers = document.querySelectorAll('.audio-item');
    const activeAudioElements = {}; // Stocke les instances HTMLAudioElement
    const staticWaveformBars = {}; // Stocke les hauteurs des barres pour chaque audioSrc

    audioPlayers.forEach(playerCard => {
        const playPauseButton = playerCard.querySelector('.play-pause-button');
        const waveformCanvas = playerCard.querySelector('.waveform-canvas');
        // const progressBarElement = playerCard.querySelector('.progress-bar'); // Plus utilisé visuellement
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

        // Générer et stocker les barres statiques une seule fois par audioSrc
        if (!staticWaveformBars[audioSrc] && waveformCanvas) {
            staticWaveformBars[audioSrc] = generateStaticWaveformBars(waveformCanvas);
            drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], 0, 1); // Dessin initial en gris
        }

        function updateDisplayWhileLoading() {
            if (durationTimeDisplay) durationTimeDisplay.textContent = "--:--";
            if (currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
            // Dessine les barres statiques grises si elles existent, sinon un message
            if (waveformCanvas) {
                if (staticWaveformBars[audioSrc]) {
                     drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], 0, 1);
                } else {
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
            
            // Redessiner la forme d'onde statique avec la progression colorée
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
             // S'assurer que les barres statiques sont générées si ce n'est pas déjà fait
            if (!staticWaveformBars[audioSrc] && waveformCanvas) {
                staticWaveformBars[audioSrc] = generateStaticWaveformBars(waveformCanvas);
                drawStaticWaveformProgress(waveformCanvas, staticWaveformBars[audioSrc], audio.currentTime, audio.duration);
            }
        });

        audio.addEventListener('timeupdate', () => {
            updateAudioDisplay();
        });
        
        audio.addEventListener('error', (e) => {
            console.error("Erreur de chargement audio pour:", audioSrc, e);
            if (waveformCanvas) {
                const ctx = waveformCanvas.getContext('2d');
                ctx.clearRect(0,0,waveformCanvas.width, waveformCanvas.height);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--light-text').trim();
                ctx.font = `12px ${getComputedStyle(document.documentElement).getPropertyValue('--font-secondary').trim()}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("Erreur Chargement", waveformCanvas.width / 2, waveformCanvas.height / 2);
            }
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
            if (staticWaveformBars[audioSrc] && waveformCanvas) { // Redessiner l'onde en gris
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
                         if (waveformCanvas) {
                            const ctx = waveformCanvas.getContext('2d');
                            ctx.clearRect(0,0,waveformCanvas.width, waveformCanvas.height);
                            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--light-text').trim();
                            ctx.font = `12px ${getComputedStyle(document.documentElement).getPropertyValue('--font-secondary').trim()}`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText("Erreur Lecture", waveformCanvas.width / 2, waveformCanvas.height / 2);
                        }
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
            if (staticWaveformBars[audioSrc] && waveformCanvas) { // Redessiner après seek
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

    // Nouvelle fonction pour générer les données des barres statiques
    function generateStaticWaveformBars(canvas) {
        if (!canvas) return [];
        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
             canvas.width = canvas.offsetWidth;
             canvas.height = canvas.offsetHeight;
        } else {
            canvas.width = 300; canvas.height = 50; // Fallback
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
    
    // Nouvelle fonction pour dessiner les barres statiques avec progression
    function drawStaticWaveformProgress(canvas, barsData, currentTime, totalDuration) {
        if (!canvas || !barsData) return;
        // S'assurer que le canvas est dimensionné
        if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                 canvas.width = canvas.offsetWidth;
                 canvas.height = canvas.offsetHeight;
            }
        } else { return; } // Ne pas dessiner si le canvas n'a pas de dimensions

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        // const height = canvas.height; // Pas utilisé directement pour le dessin des barres stockées
        ctx.clearRect(0, 0, width, canvas.height); // Efface le canvas

        const playedColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-played').trim();
        const unplayedColor = getComputedStyle(document.documentElement).getPropertyValue('--waveform-unplayed').trim();
        
        let progressX = 0;
        if (totalDuration > 0 && !isNaN(totalDuration)) { // Évite la division par zéro
            progressX = (currentTime / totalDuration) * width;
        }


        barsData.forEach(bar => {
            // Si le début de la barre (bar.x) est avant la tête de lecture (progressX)
            // OU si une partie significative de la barre est avant la tête de lecture
            // On peut simplifier en disant : si le milieu de la barre est avant progressX
            const barMidPointX = bar.x + bar.width / 2;
            ctx.fillStyle = barMidPointX < progressX ? playedColor : unplayedColor;
            ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
        });
    }

}); // Fin de DOMContentLoaded