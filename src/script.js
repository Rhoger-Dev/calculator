/* ============================================
           6) ESTADO DE LA CALCULADORA
           ============================================
           Guardamos todo en un único objeto "state".
           Esto es más fácil de razonar que tener
           variables sueltas por todos lados. */
        const state = {
            current: '0',       // lo que se ve en pantalla ahora mismo
            previous: null,      // el número guardado antes de elegir un operador
            operator: null,       // '+', '−', '×' o '÷'
            waitingForNext: false, // true justo después de pulsar un operador
            history: []           // lista de operaciones ya resueltas
        };

        const resultEl = document.getElementById('result');
        const exprEl = document.getElementById('expression');
        const historyEl = document.getElementById('history');
        const ribbon = document.getElementById('ribbon');
        const keypad = document.getElementById('keypad');

        /* ============================================
           7) FUNCIONES PURAS DE CÁLCULO
           ============================================ */
        function calculate(a, operator, b) {
            a = parseFloat(a);
            b = parseFloat(b);
            switch (operator) {
                case '+': return a + b;
                case '−': return a - b;
                case '×': return a * b;
                case '÷': return b === 0 ? NaN : a / b;
                default: return b;
            }
        }

        // Evita mostrar 0.30000000000000004 y números eternos
        function formatNumber(n) {
            if (Number.isNaN(n)) return 'Error';
            if (!isFinite(n)) return 'Error';
            const rounded = Math.round(n * 1e9) / 1e9;
            return rounded.toString();
        }

        /* ============================================
           8) ACCIONES — cada botón dispara una de estas
           ============================================ */
        function inputDigit(d) {
            if (state.waitingForNext) {
                state.current = d;
                state.waitingForNext = false;
            } else {
                state.current = state.current === '0' ? d : state.current + d;
            }
        }

        function inputDecimal() {
            if (state.waitingForNext) {
                state.current = '0.';
                state.waitingForNext = false;
                return;
            }
            if (!state.current.includes('.')) state.current += '.';
        }

        function chooseOperator(op) {
            // Si ya había un operador pendiente, resolvemos esa cuenta primero
            // (esto permite encadenar: 2 + 3 + 4 =)
            if (state.operator && !state.waitingForNext) {
                const result = calculate(state.previous, state.operator, state.current);
                state.previous = formatNumber(result);
                state.current = state.previous;
            } else {
                state.previous = state.current;
            }
            state.operator = op;
            state.waitingForNext = true;
        }

        function equals() {
            if (state.operator === null) return;
            const expr = `${state.previous} ${state.operator} ${state.current}`;
            const result = calculate(state.previous, state.operator, state.current);
            const formatted = formatNumber(result);

            addHistoryEntry(expr, formatted);

            state.current = formatted;
            state.previous = null;
            state.operator = null;
            state.waitingForNext = true; // el próximo dígito empieza una cuenta nueva

            // el "sello de tinta": quitamos y volvemos a poner la clase para
            // que la animación se repita cada vez
            resultEl.classList.remove('stamp');
            void resultEl.offsetWidth; // truco para reiniciar la animación CSS
            resultEl.classList.add('stamp');
        }

        function backspace() {
            state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
        }

        function clearAll() {
            state.current = '0';
            state.previous = null;
            state.operator = null;
            state.waitingForNext = false;
        }

        /* ============================================
           9) HISTORIAL — la página izquierda
           ============================================ */
        function addHistoryEntry(expr, result) {
            state.history.unshift({ expr, result, n: state.history.length + 1 });
            renderHistory();
        }

        function renderHistory() {
            if (state.history.length === 0) {
                historyEl.innerHTML = '<p class="empty-note">Aún no hay entradas en esta página...</p>';
                return;
            }
            historyEl.innerHTML = state.history.map(item => `
    <div class="entry">
        <span class="num">${item.n}.</span>
        <span class="expr">${item.expr}</span>
        <span class="eq"> = ${item.result}</span>
    </div>
            `).join('');
        }

        /* ============================================
           10) RENDER — sincroniza el "state" con el DOM
           ============================================ */
        function render() {
            resultEl.textContent = state.current;
            exprEl.textContent = state.previous !== null
                ? `${state.previous} ${state.operator}`
                : '\u00A0'; // espacio no separable para mantener la altura de la línea
        }

        /* ============================================
           11) EVENTOS — clics del teclado del libro
           ============================================ */
        keypad.addEventListener('click', (e) => {
            const btn = e.target.closest('button.key');
            if (!btn) return;
            const action = btn.dataset.action;
            const value = btn.dataset.value;

            if (action === 'digit') inputDigit(value);
            else if (action === 'decimal') inputDecimal();
            else if (action === 'operator') chooseOperator(value);
            else if (action === 'equals') equals();
            else if (action === 'backspace') backspace();
            else if (action === 'clear') clearAll();

            render();
        });

        // El marcador de tela (ribbon) también limpia todo, con un pequeño gesto
        ribbon.addEventListener('click', () => {
            clearAll();
            state.history = [];
            renderHistory();
            render();
        });

        /* ============================================
           12) SOPORTE DE TECLADO FÍSICO
           ============================================ */
        window.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
            else if (e.key === '.') inputDecimal();
            else if (e.key === '+') chooseOperator('+');
            else if (e.key === '-') chooseOperator('−');
            else if (e.key === '*') chooseOperator('×');
            else if (e.key === '/') { e.preventDefault(); chooseOperator('÷'); }
            else if (e.key === 'Enter' || e.key === '=') equals();
            else if (e.key === 'Backspace') backspace();
            else if (e.key === 'Escape') clearAll();
            else return;

            render();
        });

        render();