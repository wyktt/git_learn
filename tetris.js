// 俄罗斯方块游戏逻辑
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

// 放大倍数
context.scale(20, 20);
nextContext.scale(20, 20);

// 方块颜色 - 莫奈风格配色
const colors = [
    null,
    '#6B9AC4', // T - 雾蓝
    '#C4A06B', // I - 沙金
    '#9AC46B', // S - 青苔绿
    '#C46B7A', // Z - 玫瑰粉
    '#D4B484', // L - 麦黄
    '#E8D5A3', // O - 奶油黄
    '#7A8B9A', // J - 灰蓝
];

// 方块形状定义
const pieces = 'ILJOTSZ';

// 创建矩阵
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// 创建方块
function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

// 绘制单个方块 - 极简风格
function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // 极简边框
                ctx.lineWidth = 0.02;
                ctx.strokeStyle = 'rgba(94, 104, 116, 0.3)';
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// 绘制游戏区域
function draw() {
    context.fillStyle = '#EBE5DE';
    context.fillRect(0, 0, canvas.width / 20, canvas.height / 20);
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

// 绘制下一个方块预览
function drawNext() {
    nextContext.fillStyle = '#F5F3ED';
    nextContext.fillRect(0, 0, nextCanvas.width / 20, nextCanvas.height / 20);
    
    const offset = {
        x: (4 - nextPiece.length) / 2,
        y: (4 - nextPiece.length) / 2,
    };
    drawMatrix(nextPiece, offset, nextContext);
}

// 合并方块到场地
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 旋转矩阵
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// 碰撞检测
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 玩家下落
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// 玩家移动
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// 玩家旋转
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 重置玩家方块
function playerReset() {
    player.matrix = nextPiece;
    nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        gameOver();
    }
    
    drawNext();
}

// 直接落下
function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

// 消除行
function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        rowCount++;
    }
    
    if (rowCount > 0) {
        // 计分规则：1行=100，2行=300，3行=500，4行=800
        const scores = [0, 100, 300, 500, 800];
        player.score += scores[rowCount] * player.level;
        player.lines += rowCount;
        
        // 每消10行升一级
        player.level = Math.floor(player.lines / 10) + 1;
        
        // 提高速度
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
    }
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = player.level;
    document.getElementById('lines').innerText = player.lines;
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    isPaused = true;
    document.getElementById('final-score').innerText = player.score;
    document.getElementById('game-over').classList.remove('hidden');
}

// 重置游戏
function resetGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.level = 1;
    player.lines = 0;
    dropInterval = 1000;
    isGameOver = false;
    isPaused = false;
    updateScore();
    playerReset();
    document.getElementById('game-over').classList.add('hidden');
}

// 游戏主循环
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = true;
let isGameOver = false;

function update(time = 0) {
    if (!isPaused && !isGameOver) {
        const deltaTime = time - lastTime;
        lastTime = time;
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        
        draw();
    }
    
    requestAnimationFrame(update);
}

// 游戏场地 (12x20)
const arena = createMatrix(12, 20);

// 玩家状态
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    level: 1,
    lines: 0,
};

// 下一个方块
let nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);

// 键盘控制
document.addEventListener('keydown', event => {
    // 防止方向键和空格键滚动页面
    if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }
    
    if (isGameOver || isPaused) return;
    
    if (event.keyCode === 37) { // 左箭头
        playerMove(-1);
    } else if (event.keyCode === 39) { // 右箭头
        playerMove(1);
    } else if (event.keyCode === 40) { // 下箭头
        playerDrop();
    } else if (event.keyCode === 38) { // 上箭头
        playerRotate(1);
    } else if (event.keyCode === 32) { // 空格
        playerHardDrop();
    } else if (event.keyCode === 80) { // P键
        togglePause();
    }
});

// 暂停/继续
function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    const btn = document.getElementById('pause-btn');
    btn.innerText = isPaused ? '继续' : '暂停';
}

// 按钮事件
document.getElementById('start-btn').addEventListener('click', () => {
    if (isGameOver) {
        resetGame();
    }
    isPaused = false;
    document.getElementById('pause-btn').innerText = '暂停';
    if (!player.matrix) {
        playerReset();
    }
});

document.getElementById('pause-btn').addEventListener('click', () => {
    togglePause();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
});

// 初始化
playerReset();
updateScore();
drawNext();
update();
