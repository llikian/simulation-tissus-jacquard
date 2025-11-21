import { ref } from 'vue';

const gridSize = ref(8);
const grid = ref([]);

export function usePatternGrid() {
    function setPatternGrid(newGrid) {
        grid.value = newGrid;
    }
    
    function fillGrid(fillValue) {
        grid.value = Array.from({ length: gridSize.value }, () =>
            Array.from({ length: gridSize.value }, () => fillValue),
        );
    }

    function toggleCell(i, j) {
        grid.value[i][j] = !grid.value[i][j];
    }

    function toggleGrid() {
        grid.value = grid.value.map((row) => row.map((cell) => !cell));
    }

    function fillPattern(f, t, offsetDelay, offset) {
        const cycle = f + t;

        let shift = 0;

        for (let i = 0; i < gridSize.value; i++) {
            if (offsetDelay > 0) {
                shift = (Math.floor(i / offsetDelay) % 2) * offset;
            }

            for (let j = 0; j < gridSize.value; j++) {
                const shiftedIndex = (j - shift + gridSize.value) % gridSize.value;

                const posInCycle = shiftedIndex % cycle;

                grid.value[i][j] = posInCycle >= f;
            }
        }
    }

    function adjustGrid(newSize) {
        const oldGrid = grid.value;
        const newGrid = [];

        for (let i = 0; i < newSize; i++) {
            newGrid[i] = [];
            for (let j = 0; j < newSize; j++) {
                newGrid[i][j] = oldGrid[i] && oldGrid[i][j] !== undefined ? oldGrid[i][j] : false;
            }
        }

        grid.value = newGrid;
    }

    return { grid, gridSize, setPatternGrid, fillGrid, toggleCell, toggleGrid, fillPattern, adjustGrid };
}