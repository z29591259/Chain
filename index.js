let GameArea;
let MatrixArea;
const MATRIX_WIDTH = 12;
const MATRIX_HEIGHT = 12;

const GAME_LOADING = 0;
const GAME_READY = 1;
const GAME_START = 2;
const GAME_PLAYING = 3;
const GAME_OVER = 4;

const TEXT_CLICK_START = '點擊開始遊戲!';
const TEXT_GAME_OVER_NOVICE = '~初心者~<br />歡迎繼續挑戰喔';
const TEXT_GAME_OVER_INTERMEDIATE = '~熟手~<br />表現得不錯喔!';
const TEXT_GAME_OVER_EXPERT = '~高手~<br />凡人到不了的境界!';
const TEXT_GAME_OVER_MASTER = '~達人~<br />無法置信的強大!!';
const TEXT_GAME_OVER_HOLY = '~真．達人~<br />真是太不可思議了!!!';

const SOUND_BG1 = 'bg1';
const SOUND_BG2 = 'bg2';
const SOUND_BG3 = 'bg3';
const SOUND_BUTTON_CLICK = 'button_click';
const SOUND_GAME_OVER = 'game_over';
const SOUND_BALL_LESS = 'ball_less';
const SOUND_BALL_MANY = 'ball_many';
const SOUND_BALL_MORE = 'ball_more';
const assetLoader = new AssetLoader({
	[SOUND_BG1]: 'audio/bg1.mp3',
	[SOUND_BG2]: 'audio/bg2.mp3',
	[SOUND_BG3]: 'audio/bg3.mp3',
	[SOUND_BUTTON_CLICK]: 'audio/button_click.mp3',
	[SOUND_GAME_OVER]: 'audio/gameover.mp3',
	[SOUND_BALL_LESS]: 'audio/less.mp3',
	[SOUND_BALL_MANY]: 'audio/many.mp3',
	[SOUND_BALL_MORE]: 'audio/more.mp3'
});
let currentBgMusic;

let CurrentStage = GAME_READY;
let CanClickBall = true;
let Matrix = [];
let UndoMatrix = [];
let SetAmount = 0;
let BallAmount = 0;
//使用陣列紀錄每次增加的分數，方便復原上一步
let ScoreCount = [0];

const POINT_LESS = 5;
const POINT_MANY = 10;

let MouseX = 0;
let MouseY = 0;

onload();

function onload() {
	GameArea = document.getElementById('game_area');
	MatrixArea = document.getElementById('matrix_area');
	resizeGameArea();
	renderMatrix();
	setGameStage(GAME_LOADING);

	document.querySelector('#game_area').addEventListener('mousemove', onMouseUpdate, false);
	document.querySelector('#game_area').addEventListener('mouseenter', onMouseUpdate, false);
	document.querySelector('#btn_start_game').addEventListener('click', () => {
		assetLoader.AssetDictionary[SOUND_BUTTON_CLICK].play();
		switch (CurrentStage) {
			case GAME_READY:
				setGameStage(GAME_START);
				break;
			case GAME_PLAYING:
			case GAME_OVER:
				setGameStage(GAME_READY);
				break;
		}
	});
	document.querySelector('#btn_undo').addEventListener('click', () => {
		if (CurrentStage != GAME_PLAYING) { return; }
		assetLoader.AssetDictionary[SOUND_BUTTON_CLICK].play();
		undo();
		updateGameStateToUi();
		if (UndoMatrix.length == 0) {
			document.querySelector('#btn_undo').classList.add('not-show');
		}
	});
	document.querySelector('#overlay').addEventListener('click', () => {
		assetLoader.AssetDictionary[SOUND_BUTTON_CLICK].play();
		switch (CurrentStage) {
			case GAME_READY:
				setGameStage(GAME_START);
				break;
			case GAME_OVER:
				setGameStage(GAME_READY);
				break;
		}
	});
	document.querySelectorAll('.ball').forEach(x => x.onmouseenter = function (e) {
		if (CurrentStage != GAME_PLAYING) { return; }
		let points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10),
			parseInt(e.target.dataset['y'], 10));
		hintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x => x.onmouseout = function (e) {
		if (CurrentStage != GAME_PLAYING || !CanClickBall) { return; }
		let points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10),
			parseInt(e.target.dataset['y'], 10));
		unhintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x => x.onclick = async function (e) {
		if (CurrentStage != GAME_PLAYING || !CanClickBall) { return; }
		let points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10),
			parseInt(e.target.dataset['y'], 10));

		if (points.length > 0) {
			//2維陣列需要使用map處理每一層複製，避免reference
			UndoMatrix.push(Matrix.map((arr) => {
				return arr.slice();
			}));
			unhintBall(points);

			CanClickBall = false;
			points.forEach(x => document.querySelector('#p' + x[0] + '_' + x[1]).classList.add('ball_clicked'));
			if (points.length <= POINT_LESS) {
				assetLoader.AssetDictionary[SOUND_BALL_LESS].play();
			} else if (points.length <= POINT_MANY) {
				assetLoader.AssetDictionary[SOUND_BALL_MANY].play();
			} else {
				assetLoader.AssetDictionary[SOUND_BALL_MORE].play();
			}
			await sleep(420);

			document.querySelector('#btn_undo').classList.remove('not-show');

			calculateScore(points);
			removeFromMatrix(points);
			calSetAmount();
			points.forEach(x => document.querySelector('#p' + x[0] + '_' + x[1]).classList.remove('ball_clicked'));
			updateGameStateToUi();
			if (SetAmount == 0) {
				setGameStage(GAME_OVER);
			}
			CanClickBall = true;
		}
	});
	window.addEventListener("resize", function () {
		resizeGameArea();
	});
}
function onMouseUpdate(e) {
	MouseX = e.pageX;
	MouseY = e.pageY;
	console.log(MouseX, MouseY);
}
/**
* 設定遊戲區域寬高
*/
function resizeGameArea() {
	let widthToHeight = 4 / 3;

	let newWidth = window.innerWidth;
	let newHeight = window.innerHeight;
	let newWidthToHeight = newWidth / newHeight;

	if (newWidthToHeight > widthToHeight) {
		newWidth = newHeight * widthToHeight;
		GameArea.style.height = newHeight + 'px';
		GameArea.style.width = newWidth + 'px';
	} else {
		newHeight = newWidth / widthToHeight;
		GameArea.style.width = newWidth + 'px';
		GameArea.style.height = newHeight + 'px';
	}

	GameArea.style.marginTop = (-newHeight / 2) + 'px';
	GameArea.style.marginLeft = (-newWidth / 2) + 'px';
}

function setGameStage(stage) {
	CurrentStage = stage;
	switch (CurrentStage) {
		case GAME_LOADING:
			assetLoader
				.Progress((key, percent, successCount, totalCount) => {
					//console.log('key=>'+key+', percent=>'+percent+', successCount=>'+successCount+', totalCount=>'+totalCount);
					setOverlay('正在載入...<br />' + percent + '%', true);
					if (percent === 100) { setGameStage(GAME_READY); }
				}).LoadError((key, errorCount, totalCount) => {
					console.log('key=>' + key + ', errorCount=>' + errorCount + ', totalCount=>' + totalCount);
				}).StartUntilEnd();
			break;
		case GAME_READY:
			document.querySelector('#btn_start_game').innerText = '開始遊戲';
			document.querySelector('#btn_undo').classList.add('not-show');
			setOverlay(TEXT_CLICK_START, true);
			resetMatrix();
			SetAmount = 0;
			BallAmount = 0;
			ScoreCount = [0];
			UndoMatrix = [];
			updateGameStateToUi();
			if (currentBgMusic === undefined) {
				setupBgMusic();
			}
			pauseBgMusic();
			break;
		case GAME_START:
			resetMatrix();
			calSetAmount();
			updateGameStateToUi();
			setGameStage(GAME_PLAYING);
			playBgMusic();
			break;
		case GAME_PLAYING:
			document.querySelector('#btn_start_game').innerText = '回主選單';
			setOverlay('', false);
			break;
		case GAME_OVER:
			let text = TEXT_GAME_OVER_NOVICE;
			if (BallAmount == 0) {
				text = TEXT_GAME_OVER_HOLY;
			} else if (BallAmount < 10) {
				text = TEXT_GAME_OVER_MASTER;
			} else if (BallAmount < 30) {
				text = TEXT_GAME_OVER_EXPERT;
			} else if (BallAmount < 50) {
				text = TEXT_GAME_OVER_INTERMEDIATE;
			}
			setOverlay(text, true);
			document.querySelector('#btn_undo').classList.add('not-show');
			pauseBgMusic();
			assetLoader.AssetDictionary[SOUND_GAME_OVER].play();
			break;
	}
}

function setupBgMusic() {
	currentBgMusic = assetLoader.AssetDictionary[SOUND_BG1];
	assetLoader.AssetDictionary[SOUND_BG1].addEventListener("ended", () => {
		currentBgMusic.currentTime = 0;
		currentBgMusic = assetLoader.AssetDictionary[SOUND_BG2];
		currentBgMusic.play();
	});
	assetLoader.AssetDictionary[SOUND_BG2].addEventListener("ended", () => {
		currentBgMusic.currentTime = 0;
		currentBgMusic = assetLoader.AssetDictionary[SOUND_BG3];
		currentBgMusic.play();
	});
	assetLoader.AssetDictionary[SOUND_BG3].addEventListener("ended", () => {
		currentBgMusic.currentTime = 0;
		currentBgMusic = assetLoader.AssetDictionary[SOUND_BG1];
		currentBgMusic.play();
	});
}

function playBgMusic() {
	currentBgMusic.play();
}

function pauseBgMusic() {
	currentBgMusic.pause();
}

function undo() {
	Matrix = UndoMatrix.pop();
	ScoreCount.pop();
}

function setOverlay(text, isVisible) {
	document.querySelector('#overlay').className = isVisible ? '' : 'hide';
	document.querySelector('#overlay > span').innerHTML = text;
}

function resetMatrix() {
	for (let i = 0; i < MATRIX_WIDTH; i++) {
		Matrix[i] = [];
		for (let j = 0; j < MATRIX_HEIGHT; j++) {
			Matrix[i][j] = getRandom(1, 5);
		}
	}
}
/**
* 建立matrix對應的DOM
* */
function renderMatrix() {
	let ball_html = '';
	for (let i = 0; i < MATRIX_WIDTH; i++) {
		for (let j = 0; j < MATRIX_HEIGHT; j++) {
			let debug_text = '';
			//debug_text = i+','+j;
			ball_html += '<figure class="ball" id="p' + i + '_' + j + '" data-x="' + i + '" data-y="' + j + '" data-no="0" >' + debug_text + '</figure>';
		}
	}
	MatrixArea.innerHTML = ball_html;
}
/**
* 將遊戲數值更新到UI上
*/
function updateGameStateToUi() {
	document.querySelector('#set_amount').innerText = SetAmount;
	document.querySelector('#ball_amount').innerText = BallAmount;
	document.querySelector('#score_count').innerText = ScoreCount.reduce((a, b) => a + b, 0);
	//update matrix
	for (let i = 0; i < MATRIX_WIDTH; i++) {
		for (let j = 0; j < MATRIX_HEIGHT; j++) {
			document.querySelector('#p' + i + '_' + j).dataset['no'] = Matrix[i][j];
			unhintBall([[i, j]]);
		}
	}
}
/**
* 根據計算消除的數量計算分數
* @param object[] points
*/
function calculateScore(points) {
	ScoreCount.push((10 + points.length * 5) * points.length);
}

/**
* 計算剩餘組數
*/
function calSetAmount() {
	SetAmount = 0;
	BallAmount = 0;
	let unchecked_matrix = [];
	for (let i = 0; i < MATRIX_WIDTH; i++) {
		unchecked_matrix[i] = [];
		for (let j = 0; j < MATRIX_HEIGHT; j++) {
			unchecked_matrix[i][j] = Matrix[i][j] != 0;
			if (Matrix[i][j] != 0) { BallAmount++; }
		}
	}
	for (let i = 0; i < MATRIX_WIDTH; i++) {
		for (let j = 0; j < MATRIX_HEIGHT; j++) {
			if (unchecked_matrix[i][j]) {
				let points = findTogetherBall(i, j);
				if (points.length > 0) {
					SetAmount++;
				}
				points.forEach(x => {
					unchecked_matrix[x[0]][x[1]] = false;
				});
			}
		}
	}
}

/**
* 消除點選的同色球，並重新排列
* @param object[] points
*/
function removeFromMatrix(points) {
	//將點位歸零
	for (let i = 0; i < points.length; i++) {
		setMatrixValue(points[i], 0);
	}

	let check_width = MATRIX_WIDTH;
	for (let i = 0; i < check_width; i++) {
		let row = Matrix[i].filter(function (item, index, array) {
			return item != 0;
		});
		if (row.length == 0) {
			//整行都是0，要移到最後一行，並少檢查一行
			Matrix.push(Matrix.splice(i, 1)[0]);
			//因為向前移一行，所以同一行再檢查一次
			i--;
			//最後一行全部是0則不檢查
			check_width--;
		} else {
			let changed = false;
			//若0的上面有顏色，讓他往下移動
			while (row.length < MATRIX_HEIGHT) {
				row.unshift(0);
				changed = true;
			}
			if (changed) {
				Matrix[i] = row;
			}
		}
	}
}

/**
* 從1點開始找相鄰的點，同色的點放入清單，檢查後從清單移除該點，接著不斷檢查清單中的點，直到清單為空
* @param int x
* @param int y
* 
* @return object[] [x,y]陣列
* */
function findTogetherBall(x, y) {
	let value = getMatrixValue([x, y]);
	if (value == 0) { return []; }
	let new_points = [[x, y]];
	let checked_points = [];

	while (new_points.length > 0) {
		let handle_point = new_points.pop();
		let near_point = [];
		//左邊
		if (handle_point[0] > 0) {
			near_point = [handle_point[0] - 1, handle_point[1]]
			if (getMatrixValue(near_point) == value && !inArray(near_point, checked_points)) {
				new_points.push(near_point);
			}
		}
		//右邊
		if (handle_point[0] < MATRIX_WIDTH - 1) {
			near_point = [handle_point[0] + 1, handle_point[1]]
			if (getMatrixValue(near_point) == value && !inArray(near_point, checked_points)) {
				new_points.push(near_point);
			}
		}
		//上面
		if (handle_point[1] > 0) {
			near_point = [handle_point[0], handle_point[1] - 1];
			if (getMatrixValue(near_point) == value && !inArray(near_point, checked_points)) {
				new_points.push(near_point);
			}
		}
		//下面
		if (handle_point[1] < MATRIX_HEIGHT - 1) {
			near_point = [handle_point[0], handle_point[1] + 1];
			if (getMatrixValue(near_point) == value && !inArray(near_point, checked_points)) {
				new_points.push(near_point);
			}
		}
		if (!inArray(handle_point, checked_points)) {
			checked_points.push(handle_point);
		}
	}
	if (checked_points.length == 1) {
		checked_points.pop();
	}
	return checked_points;
}

function hintBall(points) {
	points.forEach(x => {
		let p = document.querySelector('#p' + x[0] + '_' + x[1]);
		if (p == null) {
			console.log("null point: " + x[0] + "," + x[1]);
		} else {
			p.classList.add('ball_clickable');
		}
	});
}

function unhintBall(points) {
	points.forEach(x => {
		let p = document.querySelector('#p' + x[0] + '_' + x[1]);
		if (p == null) {
			console.log("null point: " + x[0] + "," + x[1]);
		} else {
			p.classList.remove('ball_clickable');
		}
	});
}

function getMatrixValue(point) {
	return Matrix[point[0]][point[1]];
}

function setMatrixValue(point, value) {
	Matrix[point[0]][point[1]] = value;
}

/**
* 暫停特定時間(ms)
* @var delay_ms
*/
const sleep = (delay_ms) => new Promise((resolve) => setTimeout(resolve, delay_ms));
/**
* item是否在positions陣列內
* @param object item
* @param object[] points
* 
* @return bool
*/
function inArray(item, points) {
	return points.some(x => x[0] == item[0] && x[1] == item[1]);
}
/**
* 產生min到max之間的亂數
* @param int min
* @param int max
* 
* @return int
*/
function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};