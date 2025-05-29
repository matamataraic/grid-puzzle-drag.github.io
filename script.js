/**
 * Grid Puzzle Drag - JavaScript Implementation
 * A sliding puzzle game with drag and drop functionality
 */

class GridPuzzle {
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.emptyPos = { row: 0, col: 0 };
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isGameActive = false;
        this.draggedElement = null;
        this.touchOffset = { x: 0, y: 0 };
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeGame();
    }

    initializeElements() {
        // Get DOM elements
        this.puzzleGrid = document.getElementById('puzzleGrid');
        this.moveCounter = document.getElementById('moveCounter');
        this.timer = document.getElementById('timer');
        this.gameStatus = document.getElementById('gameStatus');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.newGameBtn = document.getElementById('newGame');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.solveBtn = document.getElementById('solveBtn');
        this.winModal = document.getElementById('winModal');
        this.playAgainBtn = document.getElementById('playAgain');
        this.closeModalBtn = document.getElementById('closeModal');
        this.finalMoves = document.getElementById('finalMoves');
        this.finalTime = document.getElementById('finalTime');
    }

    setupEventListeners() {
        // Button event listeners
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.shuffleBtn.addEventListener('click', () => this.shufflePuzzle());
        this.solveBtn.addEventListener('click', () => this.solvePuzzle());
        this.gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.initializeGame();
        });

        // Modal event listeners
        this.playAgainBtn.addEventListener('click', () => {
            this.hideModal();
            this.startNewGame();
        });
        this.closeModalBtn.addEventListener('click', () => this.hideModal());

        // Click outside modal to close
        this.winModal.addEventListener('click', (e) => {
            if (e.target === this.winModal) {
                this.hideModal();
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    initializeGame() {
        this.createGrid();
        this.renderGrid();
        this.resetGameState();
        this.updateGameStatus('Ready - Click "New Game" to start');
    }

    createGrid() {
        // Initialize grid with numbers 1 to gridSize²-1, and one empty space
        this.grid = [];
        let number = 1;
        
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                if (row === this.gridSize - 1 && col === this.gridSize - 1) {
                    this.grid[row][col] = 0; // Empty space
                    this.emptyPos = { row, col };
                } else {
                    this.grid[row][col] = number++;
                }
            }
        }

        // Update CSS grid layout
        this.puzzleGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        this.puzzleGrid.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
    }

    renderGrid() {
        this.puzzleGrid.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.grid[row][col];
                if (value === 0) {
                    cell.classList.add('empty');
                    cell.textContent = '';
                } else {
                    cell.textContent = value;
                    cell.draggable = true;
                    this.setupCellEventListeners(cell);
                }
                
                this.puzzleGrid.appendChild(cell);
            }
        }
    }

    setupCellEventListeners(cell) {
        // Mouse events
        cell.addEventListener('click', (e) => this.handleCellClick(e));
        cell.addEventListener('dragstart', (e) => this.handleDragStart(e));
        cell.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        // Touch events for mobile
        cell.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        cell.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        cell.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Drop events
        cell.addEventListener('dragover', (e) => this.handleDragOver(e));
        cell.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleCellClick(e) {
        if (!this.isGameActive) return;
        
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        
        this.tryMoveTile(row, col);
    }

    handleDragStart(e) {
        if (!this.isGameActive) return;
        
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragEnd(e) {
        if (e.target.classList.contains('dragging')) {
            e.target.classList.remove('dragging');
        }
        this.draggedElement = null;
        this.clearDropTargets();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (e.target.classList.contains('empty')) {
            e.target.classList.add('drop-target');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.clearDropTargets();
        
        if (!this.draggedElement || !e.target.classList.contains('empty')) {
            return;
        }
        
        const dragRow = parseInt(this.draggedElement.dataset.row);
        const dragCol = parseInt(this.draggedElement.dataset.col);
        
        this.tryMoveTile(dragRow, dragCol);
    }

    handleTouchStart(e) {
        if (!this.isGameActive) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        
        this.touchOffset.x = touch.clientX - rect.left;
        this.touchOffset.y = touch.clientY - rect.top;
        
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
    }

    handleTouchMove(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        
        // Visual feedback for touch dragging
        this.draggedElement.style.position = 'fixed';
        this.draggedElement.style.left = (touch.clientX - this.touchOffset.x) + 'px';
        this.draggedElement.style.top = (touch.clientY - this.touchOffset.y) + 'px';
        this.draggedElement.style.zIndex = '1000';
    }

    handleTouchEnd(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        // Reset position
        this.draggedElement.style.position = '';
        this.draggedElement.style.left = '';
        this.draggedElement.style.top = '';
        this.draggedElement.style.zIndex = '';
        
        // Find the element under the touch point
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (elementBelow && elementBelow.classList.contains('empty')) {
            const dragRow = parseInt(this.draggedElement.dataset.row);
            const dragCol = parseInt(this.draggedElement.dataset.col);
            this.tryMoveTile(dragRow, dragCol);
        }
        
        this.draggedElement.classList.remove('dragging');
        this.draggedElement = null;
    }

    clearDropTargets() {
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    }

    handleKeyPress(e) {
        if (!this.isGameActive) return;
        
        const { row, col } = this.emptyPos;
        let targetRow = row;
        let targetCol = col;
        
        switch (e.key) {
            case 'ArrowUp':
                targetRow = row + 1;
                break;
            case 'ArrowDown':
                targetRow = row - 1;
                break;
            case 'ArrowLeft':
                targetCol = col + 1;
                break;
            case 'ArrowRight':
                targetCol = col - 1;
                break;
            default:
                return;
        }
        
        if (this.isValidPosition(targetRow, targetCol)) {
            this.tryMoveTile(targetRow, targetCol);
        }
    }

    tryMoveTile(row, col) {
        if (!this.isValidMove(row, col)) return;
        
        // Swap tile with empty space
        const temp = this.grid[row][col];
        this.grid[row][col] = this.grid[this.emptyPos.row][this.emptyPos.col];
        this.grid[this.emptyPos.row][this.emptyPos.col] = temp;
        
        // Update empty position
        this.emptyPos = { row, col };
        
        // Update moves and render
        this.moves++;
        this.updateMoveCounter();
        this.renderGrid();
        
        // Check for win condition
        if (this.checkWinCondition()) {
            this.handleWin();
        }
    }

    isValidMove(row, col) {
        const { row: emptyRow, col: emptyCol } = this.emptyPos;
        
        // Check if the tile is adjacent to the empty space
        const rowDiff = Math.abs(row - emptyRow);
        const colDiff = Math.abs(col - emptyCol);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    }

    checkWinCondition() {
        let expectedValue = 1;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (row === this.gridSize - 1 && col === this.gridSize - 1) {
                    // Last cell should be empty (0)
                    if (this.grid[row][col] !== 0) return false;
                } else {
                    if (this.grid[row][col] !== expectedValue) return false;
                    expectedValue++;
                }
            }
        }
        
        return true;
    }

    startNewGame() {
        this.initializeGame();
        this.shufflePuzzle();
        this.startTimer();
        this.isGameActive = true;
        this.updateGameStatus('Playing...');
    }

    shufflePuzzle() {
        // Perform random valid moves to shuffle the puzzle
        const shuffleMoves = this.gridSize * this.gridSize * 10;
        
        for (let i = 0; i < shuffleMoves; i++) {
            const possibleMoves = this.getPossibleMoves();
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                
                // Swap without counting as a move
                const temp = this.grid[randomMove.row][randomMove.col];
                this.grid[randomMove.row][randomMove.col] = this.grid[this.emptyPos.row][this.emptyPos.col];
                this.grid[this.emptyPos.row][this.emptyPos.col] = temp;
                this.emptyPos = randomMove;
            }
        }
        
        this.renderGrid();
    }

    getPossibleMoves() {
        const moves = [];
        const { row, col } = this.emptyPos;
        
        // Check all four directions
        const directions = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
        ];
        
        directions.forEach(pos => {
            if (this.isValidPosition(pos.row, pos.col)) {
                moves.push(pos);
            }
        });
        
        return moves;
    }

    solvePuzzle() {
        if (!this.isGameActive) return;
        
        // Simple solve animation - move towards solved state
        this.isGameActive = false;
        this.updateGameStatus('Solving...');
        
        // Reset to solved state
        this.createGrid();
        this.renderGrid();
        this.stopTimer();
        this.updateGameStatus('Solved');
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.startTime) return;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateMoveCounter() {
        this.moveCounter.textContent = this.moves;
    }

    updateGameStatus(status) {
        this.gameStatus.textContent = status;
    }

    resetGameState() {
        this.moves = 0;
        this.updateMoveCounter();
        this.timer.textContent = '00:00';
        this.stopTimer();
        this.isGameActive = false;
    }

    handleWin() {
        this.isGameActive = false;
        this.stopTimer();
        this.updateGameStatus('Completed!');
        
        // Update modal with game stats
        this.finalMoves.textContent = this.moves;
        this.finalTime.textContent = this.timer.textContent;
        
        // Show win modal
        this.showModal();
    }

    showModal() {
        this.winModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.winModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GridPuzzle();
});

// Add some utility functions for enhanced functionality
class GameUtils {
    static isSolvable(grid, gridSize) {
        // Check if a puzzle configuration is solvable
        const flatGrid = grid.flat().filter(num => num !== 0);
        let inversions = 0;
        
        for (let i = 0; i < flatGrid.length - 1; i++) {
            for (let j = i + 1; j < flatGrid.length; j++) {
                if (flatGrid[i] > flatGrid[j]) {
                    inversions++;
                }
            }
        }
        
        if (gridSize % 2 === 1) {
            return inversions % 2 === 0;
        } else {
            const emptyRowFromBottom = gridSize - Math.floor(grid.findIndex(row => row.includes(0)));
            return (inversions + emptyRowFromBottom) % 2 === 1;
        }
    }
    
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    static saveGameState(gameState) {
        localStorage.setItem('gridPuzzleState', JSON.stringify(gameState));
    }
    
    static loadGameState() {
        const saved = localStorage.getItem('gridPuzzleState');
        return saved ? JSON.parse(saved) : null;
    }
}
