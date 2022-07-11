//使用canvas呈現主遊戲畫面
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 605;
canvas.height = 845;

//透過scoreEL控制HTML上的分數、透過pacManIcon控制剩餘生命圖示
const scoreEL = document.querySelector('#scoreEL');
const pacManIcon1 = document.querySelector('#pacManIcon1');
const pacManIcon2 = document.querySelector('#pacManIcon2');

//控制音效
const pacManChomp = document.querySelector('#chomp');
const pacManEatGhost = document.querySelector('#eatghost');
const panManDeath = document.querySelector('#death');

//建立遊戲邊界的class，邊界由長寬各為40px的方塊組成
class Boundary {
    static width = 40;
    static height = 40;
    constructor({position, image}) {
        this.position = position;
        this.width = 40;
        this.height = 40;
        this.image = image;
    }

    //畫出邊界
    draw() {
        ctx.drawImage(this.image, this.position.x, this.position.y);
    }
}

//建立小精靈本人的class，velocity為小精靈將要移動的方向變化量，preCollisions為記錄先前撞牆方向
class Player {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 15;
        this.radians = 0.75;
        this.openRate = 0.12;
        this.rotation = 0;
        this.preCollisions = [];
    }

    //畫出小精靈 & 控制其旋轉
    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.translate(-this.position.x, -this.position.y);
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, this.radians, Math.PI * 2 - this.radians);
        ctx.lineTo(this.position.x, this.position.y);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    //更新每次移動後的位置並將其畫出 & 控制小精靈張嘴速度
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.radians < 0 || this.radians > 0.75) { this.openRate = -this.openRate; }
        this.radians += this.openRate;
    }
}

//建立鬼的class，velocity為鬼將要移動的方向變化量，preCollisions為記錄先前撞牆方向
class Ghost {
    static speed = 2;
    constructor({position, velocity, color = '#D10000'}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 15;
        this.color = color;
        this.preCollisions = [];
        this.speed = 2;
        this.scared = 0;
    }

    //畫出鬼
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        if (this.scared === 1) { ctx.fillStyle = 'blue'; }
        else if (this.scared === 2) { ctx.fillStyle = 'white'; }
        else { ctx.fillStyle = this.color; }
        ctx.fill();
        ctx.closePath();
    }

    //更新每次移動後的位置並將其畫出
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

//建立分數小星星Pellet的class
class Pellet {
    constructor({position}) {
        this.position = position;
        this.radius = 3;
    }

    //畫出pellet
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }
}

//建立能量球PowerUp的class
class PowerUp {
    constructor({position}) {
        this.position = position;
        this.radius = 8;
    }

    //畫出PowerUp
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }
}

//建立傳送門的class
class Gateway {
    constructor({position}) {
        this.position = position;
    }
}

//準備一個要放入邊界object、一個要放入能量球object、一個要放入Pellet object以及一個要放入Gateway object的list
const boundaries = [];
const powerUps = [];
const pellets = [];
const gateways = [];

//初始化小精靈
const player = new Player({
    position: { x: Boundary.width + Boundary.width / 2, y: Boundary.height + Boundary.height / 2 },
    velocity: { x: 0, y: 0 }
});

//初始化鬼
const ghosts = [
    new Ghost({
        position: { x: Boundary.width * 6 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2 },
        velocity: { x: Ghost.speed, y: 0 }
    }),
    new Ghost({
        position: { x: Boundary.width * 7 + Boundary.width / 2, y: Boundary.height * 11 + Boundary.height / 2 },
        velocity: { x: Ghost.speed, y: 0 },
        color: 'pink'
    }),
    new Ghost({
        position: { x: Boundary.width * 3 + Boundary.width / 2, y: Boundary.height * 9 + Boundary.height / 2 },
        velocity: { x: Ghost.speed, y: 0 },
        color: 'orange'
    }),
    new Ghost({
        position: { x: Boundary.width * 1 + Boundary.width / 2, y: Boundary.height * 13 + Boundary.height / 2 },
        velocity: { x: Ghost.speed, y: 0 },
        color: '#00C2C2'
    })
]

//遊戲地圖代號
const map = [
    ['1', '-', '-', '-', '-', '-', '-', '7', '-', '-', '-', '-', '-', '-', '2'],
    ['|', ' ', '.', '.', '.', '.', '.', '|', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '[', ']', '.', '_', '.', '[', ']', '.', 'b', '.', '|'],
    ['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '^', '.', '[', '7', ']', '.', '^', '.', 'b', 'p', '|'],
    ['|', '.', '.', '.', '|', '.', '.', '|', '.', '.', '|', '.', '.', '.', '|'],
    ['4', '-', '2', '.', '6', ']', '.', '_', '.', '[', '8', '.', '1', '-', '3'],
    [' ', ' ', '|', '.', '|', '.', '.', '.', '.', '.', '|', '.', '|', ' ', ' '],
    ['-', '-', '3', '.', '_', '.', '[', '-', ']', '.', '_', '.', '4', '-', '-'],
    ['g', ' ', ' ', '.', '.', '.', ' ', ' ', ' ', '.', '.', '.', ' ', ' ', 'g'],
    ['-', '-', '2', '.', '^', '.', '[', '-', ']', '.', '^', '.', '1', '-', '-'],
    [' ', ' ', '|', '.', '|', '.', '.', '.', '.', '.', '|', '.', '|', ' ', ' '],
    ['1', '-', '3', '.', '_', '.', '[', '7', ']', '.', '_', '.', '4', '-', '2'],
    ['|', '.', '.', '.', '.', '.', '.', '|', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', 'b', '.', '[', ']', '.', '_', '.', '[', ']', '.', 'b', '.', '|'],
    ['|', 'p', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
    ['6', '-', ']', '.', '^', '.', '[', '7', ']', '.', '^', '.', '[', '-', '8'],
    ['|', '.', '.', '.', '|', '.', '.', '|', '.', '.', '|', '.', '.', '.', '|'],
    ['|', '.', '[', '-', '5', ']', '.', '_', '.', '[', '5', '-', ']', '.', '|'],
    ['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
    ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']
];

//建立一個給予圖片位址即可輸出能呈現在HTML上的圖片的函式
function createImage(src) {
    const image = new Image();
    image.src = src;
    return image;
}

//透過地圖代號將邊界object存入邊界list ---> 建立遊戲地圖
map.forEach((row, i) => {
    row.forEach((symbol, j) => {
        switch(symbol) {
            case '-':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeHorizontal.png')
                    })
                );
                break;
            case '|':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeVertical.png')
                    })
                );
                break;
            case '1':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeCorner1.png')
                    })
                );
                break;
            case '2':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeCorner2.png')
                    })
                );
                break;
            case '3':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeCorner3.png')
                    })
                );
                break;
            case '4':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeCorner4.png')
                    })
                );
                break;
            case 'b':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/block.png')
                    })
                );
                break;
            case '[':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/capLeft.png')
                    })
                );
                break;
            case ']':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/capRight.png')
                    })
                );
                break;
            case '_':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/capBottom.png')
                    })
                );
                break;
            case '^':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/capTop.png')
                    })
                );
                break;
            case '+':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeCross.png')
                    })
                );
                break;
            case '5':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeConnectorTop.png')
                    })
                );
                break;
            case '6':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeConnectorRight.png')
                    })
                );
                break;
            case '7':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeConnectorBottom.png')
                    })
                );
                break;
            case '8':
                boundaries.push(
                    new Boundary({
                        position: { x: Boundary.width * j, y: Boundary.height * i },
                        image: createImage('./img/pipeConnectorLeft.png')
                    })
                );
                break;
            case '.':
                pellets.push(
                    new Pellet({
                        position: { x: Boundary.width * j + Boundary.width / 2,
                                    y: Boundary.height * i + Boundary.height / 2 }
                    })
                );
                break;
            case 'g':
                gateways.push(
                    new Gateway({
                        position: { x: Boundary.width * j, y: Boundary.height * i }
                    })
                );
                break;
            case 'p':
                powerUps.push(
                    new PowerUp({
                        position: { x: Boundary.width * j + Boundary.width / 2,
                                    y: Boundary.height * i + Boundary.height / 2 }
                    })
                );
                break;
        }
    })
})

//初始化分數、計算初始pellets總數
let score = 0, pelletsNum = pellets.length;

//初始化生命
let lives = 2;

//currentKey:更新至目前的方向按鍵;  lastKey:玩家前一個按的方向按鍵  (方向按鍵: 'w', 'a', 's', 'd')
//waitKey:儲存目前撞牆方向鍵  (玩家遇到路口並且希望轉彎時，可能會先按該轉彎方向鍵，由於該方向鍵目前會使小精靈撞牆，因此先記錄該方向鍵)
let lastKey = '';
let currentKey = '';
let waitKey = '';

//記錄玩家按下方向鍵的瞬間 (按下為true，之後變回false) ---> 用來配合紀錄waitKey
const Keys = {
    w: { pressed: false },
    a: { pressed: false },
    s: { pressed: false },
    d: { pressed: false }
};

//用來紀錄小精靈的前一個移動方向變化量
const lastVelocityOfPlayer = { x: 0, y: 0 };

//判定小精靈或鬼將要移動的方向是否會撞上邊界
function circleCollideWithRectangle({ circle, rectangle }) {
    const padding = Boundary.width / 2 - circle.radius - 1;
    return (circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding && 
            circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding && 
            circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding && 
            circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding);
}

//建立每幀動畫的編號
let animationID;
let begin = true;

//主動畫程式(不斷刷新畫面)
function animation() {
    animationID = requestAnimationFrame(animation);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pacManChomp.play();

    //根據方向按鍵('w', 'a', 's', 'd')改變小精靈的移動方向變化量
    //透過不同條件判斷去更改waitKey(根據玩家當下按的方向鍵及該方向是否撞牆)以及currentKey(若玩家當下按的方向鍵會撞牆 ---> 保持原移動方向(lastKey))
    if (currentKey === 'w') {
        boundaries.forEach((boundary) => {
            if (circleCollideWithRectangle({ circle: {...player, velocity: {x: 0, y: -5}}, rectangle: boundary })) {
                player.velocity.y = 0;
                if (Keys.w.pressed === true && lastVelocityOfPlayer.y != -5) {
                    waitKey = currentKey;
                    Keys.w.pressed = false;
                }
                if (Math.abs(lastVelocityOfPlayer.x) == 5) { currentKey = lastKey; }
            } else {
                if (waitKey === 's') { waitKey = ''; }
                player.velocity.y = -5;
            }
        })
    } else if (currentKey === 'a') {
        boundaries.forEach((boundary) => {
            if (circleCollideWithRectangle({ circle: {...player, velocity: {x: -5, y: 0}}, rectangle: boundary })) {
                player.velocity.x = 0;
                if (Keys.a.pressed === true && lastVelocityOfPlayer.x != -5) {
                    waitKey = currentKey;
                    Keys.a.pressed = false;
                }
                if (Math.abs(lastVelocityOfPlayer.y) == 5) { currentKey = lastKey; }
            } else {
                if (waitKey === 'd') { waitKey = ''; }
                player.velocity.x = -5;
            }
        })
    } else if (currentKey === 's') {
        boundaries.forEach((boundary) => {
            if (circleCollideWithRectangle({ circle: {...player, velocity: {x: 0, y: 5}}, rectangle: boundary })) {
                player.velocity.y = 0;
                if (Keys.s.pressed === true && lastVelocityOfPlayer.y != 5) {
                    waitKey = currentKey;
                    Keys.s.pressed = false;
                }
                if (Math.abs(lastVelocityOfPlayer.x) == 5) { currentKey = lastKey; }
            } else {
                if (waitKey === 'w') { waitKey = ''; }
                player.velocity.y = 5;
            }
        })
    } else if (currentKey === 'd') {
        boundaries.forEach((boundary) => {
            if (circleCollideWithRectangle({ circle: {...player, velocity: {x: 5, y: 0}}, rectangle: boundary })) {
                player.velocity.x = 0;
                if (Keys.d.pressed === true && lastVelocityOfPlayer.x != 5) {
                    waitKey = currentKey;
                    Keys.d.pressed = false;
                }
                if (Math.abs(lastVelocityOfPlayer.y) == 5) { currentKey = lastKey; }
            } else {
                if (waitKey === 'a') { waitKey = ''; }
                player.velocity.x = 5;
            }
        })
    }

    //畫出pellets並執行小精靈吃掉pellet的畫面變化(包含分數)
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        pellet.draw();

        if (Math.hypot(pellet.position.x - player.position.x, pellet.position.y - player.position.y) < pellet.radius + player.radius) {
            pellets.splice(i, 1);
            score += 10;
            scoreEL.innerHTML = score;
        }
    }

    //判定小精靈是否撞到鬼
    for (let i = ghosts.length - 1; i >= 0; i--) {
        const ghost = ghosts[i];
        if (Math.hypot(ghost.position.x - player.position.x, ghost.position.y - player.position.y) < ghost.radius + player.radius) {
            //鬼處於驚嚇狀態時 ---> 小精靈吃掉鬼 ---> 鬼7秒後重生
            if (ghost.scared === 1 || ghost.scared === 2) {
                let deadGhostColor = [];
                deadGhostColor.push(ghost.color);
                cancelAnimationFrame(animationID);
                setTimeout(() => {
                    animationID = requestAnimationFrame(animation);
                    ghosts.splice(i, 1);
                    score += 100;
                    scoreEL.innerHTML = score;
                }, 1000);
                setTimeout(() => {
                    const newGhost = new Ghost({
                        position: { x: Boundary.width * Math.floor(map[0].length / 2) + Boundary.width / 2, 
                                    y: Boundary.height * (Math.floor(map.length / 2) - 1) + Boundary.height / 2 },
                        velocity: { x: Ghost.speed, y: 0 },
                        color: deadGhostColor[0]
                    });
                    deadGhostColor.splice(0, 1);
                    ghosts.push(newGhost);
                }, 7000);
            }else {
                panManDeath.play();
                //若生命值大於0 ---> 小精靈回到原點; 若生命值等於0 ---> lose the game
                if (lives > 0) {
                    cancelAnimationFrame(animationID);
                    setTimeout(() => {
                        animationID = requestAnimationFrame(animation);
                        player.velocity.x = 0;
                        player.velocity.y = 0;
                        player.position.x = Boundary.width + Boundary.width / 2;
                        player.position.y = Boundary.height + Boundary.height / 2;
                        player.rotation = 0;
                        currentKey = '';
                        lives --;
                    }, 1600);
                }else {
                    swal('What a joke!', 'You lose the game.', 'warning', {button: 'Damn!'});
                    cancelAnimationFrame(animationID);
                }
            }
        }
    }

    //win the game!
    if (pellets.length === 0) {
        swal('Congratulations!', 'You win the game.', 'success', {button: 'No sweat!'});
        cancelAnimationFrame(animationID);
    }

    //顯示小精靈當前還剩幾條生命
    if (lives === 2) {
        pacManIcon1.innerHTML = "<img src=\"./img/pacMan.png\" width=\"22px\" height=\"22px\">";
        pacManIcon2.innerHTML = "<img src=\"./img/pacMan.png\" width=\"22px\" height=\"22px\">";
    }
    else if (lives === 1) { pacManIcon2.innerHTML = "<img src=\"./img/black.jpg\" width=\"22px\" height=\"22px\">"; }
    else { pacManIcon1.innerHTML = "<img src=\"./img/black.jpg\" width=\"22px\" height=\"22px\">"; }

    //畫出能量球，小精靈吃掉能量球 ---> 鬼變色6.5秒 (第4秒開始閃爍以示警告)
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.draw();

        if (Math.hypot(powerUp.position.x - player.position.x, powerUp.position.y - player.position.y) < powerUp.radius + player.radius) {
            pacManEatGhost.play();
            powerUps.splice(i, 1);

            ghosts.forEach((ghost) => {
                ghost.scared = 1;
                setTimeout(() => { ghost.scared = 0; }, 6500)
                setTimeout(() => { ghost.scared = 2; }, 4000)
                setTimeout(() => { ghost.scared = 1; }, 4500)
                setTimeout(() => { ghost.scared = 2; }, 5000)
                setTimeout(() => { ghost.scared = 1; }, 5500)
                setTimeout(() => { ghost.scared = 2; }, 6000)
            })
        }
    }

    //紀錄左右傳送門的x座標
    let gatewayLeft = gateways[0], gatewayRight = gateways[1];
    let xBound = { left: gatewayLeft.position.x, right: gatewayRight.position.x + Boundary.width };

    //小精靈碰到傳送門 ---> 傳送小精靈
    if (player.position.x === xBound.left && player.velocity.x < 0) { player.position.x = xBound.right; }
    else if (player.position.x === xBound.right && player.velocity.x > 0) { player.position.x = xBound.left; }

    //畫出邊界並且使小精靈撞牆後停下
    boundaries.forEach((boundary) => {
        boundary.draw();

        if ( circleCollideWithRectangle({ circle: player, rectangle: boundary }) ) {
                player.velocity.x = 0;
                player.velocity.y = 0;
                Keys.w.pressed = false;
                Keys.a.pressed = false;
                Keys.s.pressed = false;
                Keys.d.pressed = false;
        }
    })

    //更新小精靈的位置
    player.update();

    //紀錄小精靈當下不能行走的方向 ---> for waitKey
    const collisions_p = [];
    boundaries.forEach((boundary) => {
        if (!collisions_p.includes('right') && 
            circleCollideWithRectangle({ circle: {...player, velocity: {x: 5, y: 0}}, rectangle: boundary })) {
                collisions_p.push('right');
            }
        if (!collisions_p.includes('left') && 
            circleCollideWithRectangle({ circle: {...player, velocity: {x: -5, y: 0}}, rectangle: boundary })) {
                collisions_p.push('left');
            }
        if (!collisions_p.includes('up') && 
            circleCollideWithRectangle({ circle: {...player, velocity: {x: 0, y: -5}}, rectangle: boundary })) {
                collisions_p.push('up');
            }
        if (!collisions_p.includes('down') && 
            circleCollideWithRectangle({ circle: {...player, velocity: {x: 0, y: 5}}, rectangle: boundary })) {
                collisions_p.push('down');
            }
    })

    //若當下不能行走的方向變多了 ---> 記錄至player.preCollisions ---> for waitKey
    if (collisions_p.length > player.preCollisions.length) {
        player.preCollisions = collisions_p;
    }

    //若當下能行走的方向變多了 ---> 把當前能行走方向儲存至pathway (不包含當前運行的反方向) ---> for waitKey
    if (collisions_p.toString() !== player.preCollisions.toString()) {
        
        //先將當前運行方向儲存至player.preCollisions，以利後續pathway的操作 ---> 避免小精靈走到轉角出問題
        if (player.velocity.x > 0) { player.preCollisions.push('right'); }
        else if (player.velocity.x < 0) { player.preCollisions.push('left'); }
        else if (player.velocity.y > 0) { player.preCollisions.push('down'); }
        else if (player.velocity.y < 0) { player.preCollisions.push('up'); }
        
        const pathway = player.preCollisions.filter((collision) => {
            return !collisions_p.includes(collision);
        });

        //當waitKey的方向是可以通行時(當前pathway存有waitKey的方向) ---> 更改小精靈當前的運行方向(轉彎)
        if (waitKey === 'w' && pathway.includes('up')) {
            currentKey = waitKey;
            waitKey = '';
        }else if (waitKey === 'a' && pathway.includes('left')) {
            currentKey = waitKey;
            waitKey = '';
        }else if (waitKey === 's' && pathway.includes('down')) {
            currentKey = waitKey;
            waitKey = '';
        }else if (waitKey === 'd' && pathway.includes('right')) {
            currentKey = waitKey;
            waitKey = '';
        }else if (Keys.w.pressed == true || Keys.a.pressed == true || Keys.s.pressed == true || Keys.d.pressed == true) {
            waitKey = '';
        }

        //清空player.preCollisions以利下回運作
        player.preCollisions = [];
    }

    //控制小精靈開嘴的方向
    if (player.velocity.x > 0) { player.rotation = 0; }
    else if (player.velocity.x < 0) { player.rotation = Math.PI; }
    else if (player.velocity.y > 0) { player.rotation = Math.PI / 2; }
    else if (player.velocity.y < 0) { player.rotation = Math.PI * 1.5; }
    
    //紀錄小精靈的前一個移動方向變化量
    lastVelocityOfPlayer.x = player.velocity.x;
    lastVelocityOfPlayer.y = player.velocity.y;

    //刷新完小精靈的位置後，小精靈的速度歸0
    player.velocity.x = 0;
    player.velocity.y = 0;

    //更新鬼的位置
    ghosts.forEach((ghost) => {
        ghost.update();

        //紀錄鬼當下不能行走的方向
        const collisions_g = [];
        boundaries.forEach((boundary) => {
            if (!collisions_g.includes('right') && 
                circleCollideWithRectangle({ circle: {...ghost, velocity: {x: ghost.speed, y: 0}}, rectangle: boundary })) {
                    collisions_g.push('right');
                }
            if (!collisions_g.includes('left') && 
                circleCollideWithRectangle({ circle: {...ghost, velocity: {x: -ghost.speed, y: 0}}, rectangle: boundary })) {
                    collisions_g.push('left');
                }
            if (!collisions_g.includes('up') && 
                circleCollideWithRectangle({ circle: {...ghost, velocity: {x: 0, y: -ghost.speed}}, rectangle: boundary })) {
                    collisions_g.push('up');
                }
            if (!collisions_g.includes('down') && 
                circleCollideWithRectangle({ circle: {...ghost, velocity: {x: 0, y: ghost.speed}}, rectangle: boundary })) {
                    collisions_g.push('down');
                }
        })

        //若當下不能行走的方向變多了 ---> 記錄至ghost.preCollisions
        if (collisions_g.length > ghost.preCollisions.length) {
            ghost.preCollisions = collisions_g;
        }

        //若當下能行走的方向變多了 ---> 把當前能行走方向儲存至pathway (不包含當前運行的反方向)
        if (collisions_g.toString() !== ghost.preCollisions.toString()) {
            
            //先將當前運行方向儲存至ghost.preCollisions，以利後續pathway的操作 ---> 避免鬼走到轉角出問題
            if (ghost.velocity.x > 0) { ghost.preCollisions.push('right'); }
            else if (ghost.velocity.x < 0) { ghost.preCollisions.push('left'); }
            else if (ghost.velocity.y > 0) { ghost.preCollisions.push('down'); }
            else if (ghost.velocity.y < 0) { ghost.preCollisions.push('up'); }
            
            const pathway = ghost.preCollisions.filter((collision) => {
                return !collisions_g.includes(collision);
            });

            //從pathway中隨機挑選一個方向前進
            const direction = pathway[ Math.floor(Math.random() * pathway.length) ];

            switch (direction) {
                case 'up':
                    ghost.velocity.x = 0;
                    ghost.velocity.y = -ghost.speed;
                    break;
                case 'down':
                    ghost.velocity.x = 0;
                    ghost.velocity.y = ghost.speed;
                    break;
                case 'right':
                    ghost.velocity.x = ghost.speed;
                    ghost.velocity.y = 0;
                    break;
                case 'left':
                    ghost.velocity.x = -ghost.speed;
                    ghost.velocity.y = 0;
                    break;
            }

            //清空ghost.preCollisions以利下回運作
            ghost.preCollisions = [];
        }

        //達到分數門檻 ---> 鬼加速
        if (pellets.length <= pelletsNum * 0.7) { ghost.speed = 2.5; }
        if (pellets.length <= pelletsNum * 0.3) { ghost.speed = 4; }

        //鬼碰到傳送門 ---> 傳送鬼
        if (ghost.position.x === xBound.left && ghost.velocity.x < 0) { ghost.position.x = xBound.right; }
        else if (ghost.position.x === xBound.right && ghost.velocity.x > 0) { ghost.position.x = xBound.left; }
    })
}

//呼叫主動畫程式
animation();

//按下按鍵('w', 'a', 's', 'd') ---> 更新將要移動的方向(currentKey)、儲存前一個按鍵方向(lastKey)，並記錄玩家正按下哪個方向鍵
addEventListener('keydown', ({ key }) => {
    switch(key) {
        case 'w':
            lastKey = currentKey;
            currentKey = 'w';
            Keys.w.pressed = true;
            break;
        case 'a':
            lastKey = currentKey;
            currentKey = 'a';
            Keys.a.pressed = true;
            break;
        case 's':
            lastKey = currentKey;
            currentKey = 's';
            Keys.s.pressed = true;
            break;
        case 'd':
            lastKey = currentKey;
            currentKey = 'd';
            Keys.d.pressed = true;
            break;
    }
});

//透過restart按鈕將畫面重整 ---> 遊戲重新開始
document.querySelector('#restart').addEventListener('click', () => {
    history.go(0);
});