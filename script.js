document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const splashScreen = document.getElementById('splash-screen');
    const startBtn = document.getElementById('start-btn');
    const questContainer = document.getElementById('quest-container');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const currentCaseEl = document.getElementById('current-case');
    const clueCounterEl = document.getElementById('clue-counter');
    const isitScoreEl = document.getElementById('isit-score');
    const bistScoreEl = document.getElementById('bist-score');
    const stages = document.querySelectorAll('.quest-stage');
    const navigation = document.getElementById('navigation');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const hintBtn = document.getElementById('hint-btn');
    const hintCounterEl = document.getElementById('hint-counter');
    const hintModal = document.getElementById('hint-modal');
    const hintText = document.getElementById('hint-text');
    const hintsRemainingEl = document.getElementById('hints-remaining');
    const closeHintBtn = document.getElementById('close-hint');
    const resultScreen = document.getElementById('result-screen');
    const resultContent = document.getElementById('result-content');
    const restartBtn = document.getElementById('restart-btn');
    const detailsBtn = document.getElementById('details-btn');
    const infoModal = document.getElementById('info-modal');
    const closeModal = document.getElementById('close-modal');
    const stageDots = document.querySelectorAll('.stage-dot');
    

    // Обнаружение мобильного устройства
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent);

    // Функция для мобильной оптимизации
    function optimizeForMobile() {
        if (!isMobile) return;
        
        // Увеличиваем время для анимаций на мобильных
        document.querySelectorAll('[style*="animation-delay"]').forEach(el => {
            const currentDelay = el.style.animationDelay;
            if (currentDelay) {
                const delayValue = parseFloat(currentDelay);
                el.style.animationDelay = (delayValue * 1.5) + 's';
            }
        });
        
        
        // Улучшаем обработку касаний
        document.addEventListener('touchstart', function() {}, {passive: true});
        
        // Предотвращаем масштабирование при двойном тапе
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Вызываем оптимизацию при загрузке
    document.addEventListener('DOMContentLoaded', function() {
        optimizeForMobile();
        
        // Добавляем класс для мобильных устройств
        if (isMobile) {
            document.body.classList.add('is-mobile');
        }
    });

    // Данные квеста
    let currentStage = 1;
    let userChoices = { isit: 0, bist: 0 };
    let cluesFound = 0;
    let hintsLeft = 3;
    let puzzleAnswers = {
        1: "this is a secret message: Counter Program Flower Inn 2024 Just want to see you when you get the real thing",
        2: "login-4", // tech3guru
        3: ["vuln-1", "vuln-3"], // Правильные ответы для чекбоксов
        4: "algo-2", // Алгоритм разрешает доступ из внутренней сети в ночное время
        5: "dmitry" // Дмитрий Иванов
    };
    
    // Подсказки для каждого этапа
    const hints = {
        1: "Шифр Цезаря со сдвигом +1: каждая буква заменена на следующую в алфавите. Например, 'U' становится 'T', 'i' становится 'h'. Первая строка расшифровывается как 'This is a secret message: Counter Program'.",
        2: "Проверь все критерии: 8 символов, содержит tech, содержит цифру 3, последний символ — буква. Из вариантов подходит только один.",
        3: "Смотри на строки с кодом. В функции check_password пароль сравнивается с хешем напрямую - это опасно. В функции get_user_data имя пользователя вставляется прямо в SQL-запрос - это позволяет SQL-инъекции.",
        4: "Преступник имел IP из внутренней сети (192.168.1.25) и атаковал в ночное время (02:47). Согласно алгоритму, это удовлетворяет условию 'внутренняя сеть И ночное время', поэтому доступ был разрешен даже без прав администратора.",
        5: "Сопоставь все улики: IP 192.168.1.25 соответствует рабочей станции Дмитрия, логин 'tech3guru' - его учетная запись, время 02:47 - он мог остаться после работы, знание уязвимостей - как администратор сети он знал о проблемах в системе."
    };
    
    // Инициализация
    init();
    
    function init() {
        // Обработчики событий
        startBtn.addEventListener('click', startQuest);
        prevBtn.addEventListener('click', goToPrevStage);
        nextBtn.addEventListener('click', goToNextStage);
        hintBtn.addEventListener('click', showHintModal);
        closeHintBtn.addEventListener('click', hideHintModal);
        restartBtn.addEventListener('click', restartQuest);
        detailsBtn.addEventListener('click', showDetails);
        closeModal.addEventListener('click', hideDetails);
        
        // Обработчики для головоломок
        setupPuzzleListeners();
        
        // Обработчики для выбора подозреваемого
        setupSuspectSelection();
        
        // Обработчики для точек прогресса
        stageDots.forEach(dot => {
            dot.addEventListener('click', function() {
                const stageNum = parseInt(this.getAttribute('data-stage'));
                if (stageNum <= currentStage) {
                    goToStage(stageNum);
                }
            });
        });
        
        // Закрытие подсказки по клику на оверлей
        const hintModalOverlay = document.querySelector('.hint-modal-overlay');
        if (hintModalOverlay) {
            hintModalOverlay.addEventListener('click', hideHintModal);
        }
        
        // Закрытие подсказки по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !hintModal.classList.contains('hidden')) {
                hideHintModal();
            }
        });
        
        // Закрытие инфо-модалки по клику вне ее
        infoModal.addEventListener('click', function(e) {
            if (e.target === infoModal) {
                hideDetails();
            }
        });
    }
    
    function setupPuzzleListeners() {
        // Головоломка 1
        const puzzle1Check = document.getElementById('puzzle-1-check');
        const puzzle1Input = document.getElementById('puzzle-1-answer');
        
        if (puzzle1Check) {
            puzzle1Check.addEventListener('click', checkPuzzle1);
            puzzle1Input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') checkPuzzle1();
            });
        }
        
        // Головоломка 2
        const puzzle2Check = document.getElementById('puzzle-2-check');
        if (puzzle2Check) puzzle2Check.addEventListener('click', checkPuzzle2);
        
        // Головоломка 3
        const puzzle3Check = document.getElementById('puzzle-3-check');
        if (puzzle3Check) puzzle3Check.addEventListener('click', checkPuzzle3);
        
        // Головоломка 4
        const puzzle4Check = document.getElementById('puzzle-4-check');
        if (puzzle4Check) puzzle4Check.addEventListener('click', checkPuzzle4);
        
        // Головоломка 5
        const puzzle5Check = document.getElementById('puzzle-5-check');
        if (puzzle5Check) puzzle5Check.addEventListener('click', checkPuzzle5);
    }
    
    function setupSuspectSelection() {
        const suspectSelects = document.querySelectorAll('.suspect-select');
        suspectSelects.forEach(select => {
            select.addEventListener('click', function() {
                suspectSelects.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('final-suspect').value = this.getAttribute('data-value');
            });
        });
    }
    
    function startQuest() {
        splashScreen.classList.add('hidden');
        questContainer.classList.remove('hidden');
        progressContainer.classList.remove('hidden');
        navigation.classList.remove('hidden');
        goToStage(1);
        initStageAnimations();
    }
    
    function goToStage(stageNum) {
        stages.forEach(stage => stage.classList.add('hidden'));
        document.getElementById(`stage-${stageNum}`).classList.remove('hidden');
        currentStage = stageNum;
        updateProgressBar();
        updateNavigation();
        updateStageDots();
        initStageAnimations();
    }
    
    function goToPrevStage() {
        if (currentStage > 1) goToStage(currentStage - 1);
    }
    
    function goToNextStage() {
        if (currentStage < stages.length) {
            goToStage(currentStage + 1);
        } else {
            showResult();
        }
    }
    
    function updateProgressBar() {
        const progress = ((currentStage - 1) / stages.length) * 100;
        progressBar.style.width = `${progress}%`;
        currentCaseEl.textContent = currentStage.toString().padStart(2, '0');
        clueCounterEl.textContent = cluesFound;
        isitScoreEl.textContent = userChoices.isit;
        bistScoreEl.textContent = userChoices.bist;
    }
    
    function updateNavigation() {
        prevBtn.disabled = currentStage === 1;
        nextBtn.innerHTML = currentStage === stages.length 
            ? '<i class="fas fa-gavel mr-2"></i>Завершить расследование'
            : 'Далее<i class="fas fa-arrow-right ml-2"></i>';
        hintCounterEl.textContent = hintsLeft;
        hintsRemainingEl.textContent = hintsLeft;
    }
    
    function updateStageDots() {
        stageDots.forEach((dot, index) => {
            const stageNum = index + 1;
            dot.classList.toggle('active', stageNum === currentStage);
            dot.classList.toggle('completed', stageNum < currentStage);
        });
    }
    
    function initStageAnimations() {
        switch(currentStage) {
            case 1:
                const typedText = document.getElementById('typed-text');
                if (typedText) {
                    typedText.textContent = '';
                    const textToType = "this is a secret message";
                    let i = 0;
                    const typeInterval = setInterval(() => {
                        if (i < textToType.length) {
                            typedText.textContent += textToType.charAt(i);
                            i++;
                        } else clearInterval(typeInterval);
                    }, 100);
                }
                break;
            case 3:
                const scanProgress = document.getElementById('scan-progress');
                if (scanProgress) {
                    setTimeout(() => scanProgress.style.width = '30%', 500);
                    setTimeout(() => scanProgress.style.width = '70%', 1500);
                    setTimeout(() => scanProgress.style.width = '100%', 2500);
                }
                break;
        }
    }
    
    // Функции проверки головоломок
    function checkPuzzle1() {
        const answerInput = document.getElementById('puzzle-1-answer');
        const feedback = document.getElementById('puzzle-1-feedback');
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = puzzleAnswers[1].toLowerCase();
        
        const keywords = ['counter program', 'flower inn', '2024'];
        let isCorrect = keywords.every(keyword => userAnswer.includes(keyword.toLowerCase()));
        
        if (isCorrect) {
            feedback.innerHTML = `
                <div class="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-2xl text-green-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-green-300">Верно! Сообщение расшифровано:</h4>
                            <p class="mt-2 font-mono text-sm">"${puzzleAnswers[1]}"</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            userChoices.bist += 10;
            cluesFound++;
            updateProgressBar();
            answerInput.disabled = true;
            document.getElementById('puzzle-1-check').disabled = true;
            updateStageDots();

        } else {
            feedback.innerHTML = `
                <div class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-times-circle text-2xl text-red-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-300">Не совсем. Попробуй еще раз.</h4>
                            <p class="mt-2">Подсказка: каждая буква заменена на предыдущую в алфавите.</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
        }
    }
    
    function checkPuzzle2() {
        const selectedRadio = document.querySelector('input[name="login"]:checked');
        const feedback = document.getElementById('puzzle-2-feedback');
        
        if (!selectedRadio) {
            feedback.innerHTML = `
                <div class="p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle text-2xl text-yellow-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-yellow-300">Выбери один из вариантов логина.</h4>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            return;
        }
        
        if (selectedRadio.id === puzzleAnswers[2]) {
            feedback.innerHTML = `
                <div class="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-2xl text-green-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-green-300">Верно! Логин восстановлен: "tech3guru"</h4>
                            <p class="mt-2">Логин удовлетворяет всем критериям:</p>
                            <ul class="mt-2 space-y-1 text-sm">
                                <li>✓ 8 символов: "tech3guru"</li>
                                <li>✓ Содержит "tech"</li>
                                <li>✓ Содержит цифру "3"</li>
                                <li>✓ Последний символ "u" — буква</li>
                                <li>✓ Сумма цифр = 3 (только одна цифра 3)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            userChoices.isit += 10;
            cluesFound++;
            updateProgressBar();
            document.querySelectorAll('.login-radio').forEach(radio => radio.disabled = true);
            document.getElementById('puzzle-2-check').disabled = true;
            updateStageDots();
            
        } else {
            feedback.innerHTML = `
                <div class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-times-circle text-2xl text-red-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-300">Неверный логин.</h4>
                            <p class="mt-2">Вспомни условия: логин должен состоять из 6 букв и содержать подстроку "tech".</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
        }
    }
    
    function checkPuzzle3() {
        const checkboxes = document.querySelectorAll('.custom-checkbox:checked');
        const feedback = document.getElementById('puzzle-3-feedback');
        
        let selectedValues = [];
        checkboxes.forEach(checkbox => selectedValues.push(checkbox.id));
        
        const correctAnswers = puzzleAnswers[3];
        let isCorrect = selectedValues.length === correctAnswers.length && 
                       selectedValues.every(value => correctAnswers.includes(value));
        
        if (isCorrect) {
            feedback.innerHTML = `
                <div class="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-2xl text-green-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-green-300">Верно! Найдены уязвимости:</h4>
                            <ul class="mt-2 space-y-1">
                                <li>• Прямое сравнение пароля с хешем</li>
                                <li>• SQL-инъекция в параметре username</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            userChoices.bist += 10;
            cluesFound++;
            updateProgressBar();
            
            // Анимация сканера
            const scanResults = [
                document.getElementById('scan-result-1'),
                document.getElementById('scan-result-2'),
                document.getElementById('scan-result-3')
            ];
            
            setTimeout(() => {
                if (scanResults[0]) {
                    scanResults[0].textContent = 'Уязвимость найдена!';
                    scanResults[0].style.color = 'var(--cyber-green)';
                }
                setTimeout(() => {
                    if (scanResults[1]) {
                        scanResults[1].textContent = 'Уязвимость найдена!';
                        scanResults[1].style.color = 'var(--cyber-green)';
                    }
                    setTimeout(() => {
                        if (scanResults[2]) {
                            scanResults[2].textContent = 'Уязвимость найдена!';
                            scanResults[2].style.color = 'var(--cyber-green)';
                        }
                    }, 500);
                }, 500);
            }, 500);
            
            document.querySelectorAll('.custom-checkbox').forEach(checkbox => checkbox.disabled = true);
            document.getElementById('puzzle-3-check').disabled = true;
            updateStageDots();
            
        } else {
            feedback.innerHTML = `
                <div class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-times-circle text-2xl text-red-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-300">Не все уязвимости найдены.</h4>
                            <p class="mt-2">Внимательно изучи строки с сравнением пароля и SQL-запросом.</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
        }
    }
    
    function checkPuzzle4() {
        const selectedRadio = document.querySelector('input[name="algorithm"]:checked');
        const feedback = document.getElementById('puzzle-4-feedback');
        
        if (!selectedRadio) {
            feedback.innerHTML = `
                <div class="p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle text-2xl text-yellow-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-yellow-300">Выбери один из вариантов.</h4>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            return;
        }
        
        if (selectedRadio.id === puzzleAnswers[4]) {
            feedback.innerHTML = `
                <div class="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-2xl text-green-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-green-300">Верно! Ошибка найдена.</h4>
                            <p class="mt-2">Алгоритм разрешает доступ из внутренней сети в ночное время без дополнительных проверок.</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            userChoices.isit += 10;
            cluesFound++;
            updateProgressBar();
            document.querySelectorAll('.algorithm-radio').forEach(radio => radio.disabled = true);
            document.getElementById('puzzle-4-check').disabled = true;
            updateStageDots();

        } else {
            feedback.innerHTML = `
                <div class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-times-circle text-2xl text-red-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-300">Неверно.</h4>
                            <p class="mt-2">Вспомни: преступник имел IP из внутренней сети и атаковал в ночное время.</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
        }
    }
    
    function checkPuzzle5() {
        const selectedSuspect = document.getElementById('final-suspect').value;
        const feedback = document.getElementById('puzzle-5-feedback');
        
        if (!selectedSuspect) {
            feedback.innerHTML = `
                <div class="p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle text-2xl text-yellow-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-yellow-300">Выбери подозреваемого.</h4>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            return;
        }
        
        if (selectedSuspect === puzzleAnswers[5]) {
            feedback.innerHTML = `
                <div class="p-4 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-2xl text-green-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-green-300">Верно! Преступник - Дмитрий Иванов.</h4>
                            <div class="mt-3 space-y-2">
                                <p>✓ Его IP: 192.168.1.25</p>
                                <p>✓ Его логин: "tech3guru"</p>
                                <p>✓ Знал об уязвимостях в системе</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
            cluesFound++;
            updateProgressBar();
            
            // Анимация доски улик
            const connectionNodes = document.querySelectorAll('.connection-node');
            const connectionLines = document.querySelectorAll('.connection-line');

            connectionNodes.forEach((node, index) => {
                setTimeout(() => {
                    node.style.transform = 'scale(1.2)';
                    node.style.boxShadow = '0 10px 30px rgba(0, 179, 255, 0.6)';
                }, 500 + index * 300);
            });
            
            connectionLines.forEach((line, index) => {
                setTimeout(() => {
                    line.style.width = '25%';
                    line.style.opacity = '1';
                }, 300 + index * 200);
            });

            setTimeout(() => {
                const center = document.querySelector('.connection-center');
                if (center) {
                    center.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    center.style.boxShadow = '0 15px 40px rgba(0, 179, 255, 0.7)';
                }
            }, 2000);
            
            document.querySelectorAll('.suspect-select').forEach(select => {
                select.style.pointerEvents = 'none';
            });
            document.getElementById('puzzle-5-check').disabled = true;
            updateStageDots();
            
            setTimeout(() => showResult(), 3000);
        } else {
            feedback.innerHTML = `
                <div class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-times-circle text-2xl text-red-400 mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-300">Неверно.</h4>
                            <p class="mt-2">Проанализируй все улики: IP-адрес, логин, знание уязвимостей.</p>
                        </div>
                    </div>
                </div>
            `;
            feedback.classList.remove('hidden');
        }
    }
    
    function showHintModal() {
        if (hintsLeft <= 0) {
            alert('У тебя закончились подсказки!');
            return;
        }
        
        const currentHint = hints[currentStage];
        if (!currentHint) return;
        
        hintText.textContent = currentHint;
        hintsRemainingEl.textContent = hintsLeft;
        hintModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Уменьшаем количество подсказок после показа
        hintsLeft--;
        hintCounterEl.textContent = hintsLeft;
        hintsRemainingEl.textContent = hintsLeft;
    }
    
    function hideHintModal() {
        hintModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    
    function showResult() {
        questContainer.classList.add('hidden');
        progressContainer.classList.add('hidden');
        navigation.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        const isitScore = userChoices.isit;
        const bistScore = userChoices.bist;
        const totalScore = isitScore + bistScore;
        const isitPercentage = totalScore > 0 ? Math.round((isitScore / totalScore) * 100) : 50;
        const bistPercentage = totalScore > 0 ? Math.round((bistScore / totalScore) * 100) : 50;
        
        let resultType, resultTitle, resultDescription, resultIcon, resultColor;
        
        if (isitScore > bistScore) {
            resultType = 'isit';
            resultTitle = 'Аналитик систем';
            resultDescription = 'Твой аналитический склад ума и умение восстанавливать данные помогли раскрыть преступление! Тебе идеально подходит направление "Информационные системы и технологии".';
            resultIcon = 'fas fa-code';
            resultColor = 'text-cyber-green';
        } else if (bistScore > isitScore) {
            resultType = 'bist';
            resultTitle = 'Криптодетектив';
            resultDescription = 'Твои навыки криптоанализа и поиска уязвимостей были ключевыми в расследовании! Тебе идеально подходит направление "Безопасность информационных систем и технологий".';
            resultIcon = 'fas fa-user-secret';
            resultColor = 'text-cyber-purple';
        } else {
            resultType = 'balanced';
            resultTitle = 'Универсальный специалист';
            resultDescription = 'Ты блестяще справился со всеми задачами! Ты можешь выбрать любое направление — "Информационные системы и технологии" или "Безопасность информационных систем".';
            resultIcon = 'fas fa-star';
            resultColor = 'text-cyber-blue';
        }
        
        resultContent.innerHTML = `
            <div class="result-card ${resultType === 'isit' ? 'isit-result' : resultType === 'bist' ? 'bist-result' : ''}">
                <div class="result-icon ${resultColor}">
                    <i class="${resultIcon}"></i>
                </div>
                <h3 class="result-title font-bold ${resultColor}">${resultTitle}</h3>
                <p class="result-description">${resultDescription}</p>
                
                <div class="mt-8">
                    <h4 class="text-xl font-bold mb-4">Результаты расследования:</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value text-cyber-green">${isitPercentage}%</div>
                            <div class="stat-label">Навыки ИСиТ</div>
                            <div class="mt-2">
                                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-cyber-green rounded-full" style="width: ${isitPercentage}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value text-cyber-purple">${bistPercentage}%</div>
                            <div class="stat-label">Навыки БИСиТ</div>
                            <div class="mt-2">
                                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-cyber-purple rounded-full" style="width: ${bistPercentage}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-8 p-4 bg-gray-900 rounded-lg">
                    <p class="text-sm text-gray-300">
                        <i class="fas fa-info-circle mr-2"></i>
                        Дело раскрыто на ${cluesFound * 20}%. Ты нашел ${cluesFound} из 5 улик.
                    </p>
                </div>
            </div>
        `;
    }
    
    function restartQuest() {
        currentStage = 1;
        userChoices = { isit: 0, bist: 0 };
        cluesFound = 0;
        hintsLeft = 3;
        
        // Сброс всех полей
        document.querySelectorAll('input, select, button').forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else if (input.type === 'text' || input.type === 'number') {
                input.value = '';
            }
            input.disabled = false;
        });
        
        document.querySelectorAll('.suspect-select').forEach(select => {
            select.classList.remove('selected');
        });
        document.getElementById('final-suspect').value = '';
        
        document.querySelectorAll('[id$="feedback"]').forEach(feedback => {
            feedback.innerHTML = '';
            feedback.classList.add('hidden');
        });
        
        const scanResults = document.querySelectorAll('.scan-result');
        scanResults.forEach(result => {
            result.textContent = '';
            result.style.color = '';
        });
        
        const scanProgress = document.getElementById('scan-progress');
        if (scanProgress) scanProgress.style.width = '0%';
        
        resultScreen.classList.add('hidden');
        splashScreen.classList.remove('hidden');
        updateProgressBar();
        updateNavigation();
        updateStageDots();
        hideHintModal();
    }
    
    function showDetails() {
        infoModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // Фокус на кнопке закрытия для доступности
        setTimeout(() => {
            const closeBtn = document.getElementById('close-modal');
            if (closeBtn) closeBtn.focus();
        }, 100);
    }

    function hideDetails() {
        infoModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }

});
