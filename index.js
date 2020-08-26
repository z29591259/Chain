let GameArea;
let MatrixArea;
const MATRIX_WIDTH = 12;
const MATRIX_HEIGHT = 12;

const GAME_READY = 0;
const GAME_START = 1;
const GAME_PLAYING = 2;
const GAME_OVER = 3;

let CurrentStage = GAME_READY;
let Matrix = [];
let SetAmount = 0;
let BallAmount = 0;
let ScoreCount = 0;
function onload(){
	GameArea = document.getElementById('game_area');
	MatrixArea = document.getElementById('matrix_area');
	resizeGameArea();
	renderMatrix();
	
	document.querySelector('#btn_start_game').addEventListener('click', ()=>{setGameStage(GAME_START);});
	document.querySelector('#btn_reset_game').addEventListener('click', ()=>{setGameStage(GAME_READY);});
	document.querySelectorAll('.ball').forEach(x=>x.onmouseenter=function(e){
		if(CurrentStage != GAME_PLAYING){return;}
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		hintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x=>x.onmouseout=function(e){
		if(CurrentStage != GAME_PLAYING){return;}
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		unhintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x=>x.onclick=function(e){
		if(CurrentStage != GAME_PLAYING){return;}
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		if(points.length > 0){
			//TODO 爆炸音效
		}
		calculateScore(points);
		removeFromMatrix(points);
		calSetAmount();
		updateGameStateToUi();
		unhintBall(points);
		if(SetAmount == 0){
			setGameStage(GAME_OVER);
		}
	});
	window.addEventListener("resize", function(){
		resizeGameArea();
	});
}
/**
* 設定遊戲區域寬高
*/
function resizeGameArea(){
	var widthToHeight = 4 / 3;
			    
	var newWidth = window.innerWidth;
	var newHeight = window.innerHeight;
	var newWidthToHeight = newWidth / newHeight;
			    
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

function setGameStage(stage){
	CurrentStage = stage;
	switch(CurrentStage){
		case GAME_READY:
			resetMatrix();
			SetAmount = 0;
			BallAmount = 0;
			ScoreCount = 0;
			updateGameStateToUi();
			//TODO 展示動畫
			break;
		case GAME_START:
			resetMatrix();
			calSetAmount();
			updateGameStateToUi();
			setGameStage(GAME_PLAYING);
			break;
		case GAME_PLAYING:
			//TODO 背景音樂
			break;
		case GAME_OVER:
			//TODO 結束音效，輸入名稱，上傳分數
			break;
	}
}

function resetMatrix(){
	for (var i=0;i<MATRIX_WIDTH;i++) {
		Matrix[i] = [];
		for(var j=0;j<MATRIX_HEIGHT;j++){
			Matrix[i][j] = getRandom(1,5);
		}
	}
}
/**
* 建立matrix對應的DOM
* */
function renderMatrix(){
	var ball_html = '';
	for (var i=0;i<MATRIX_WIDTH;i++) {
    	for(var j=0;j<MATRIX_HEIGHT;j++){
        	var debug_text = '';
        	//debug_text = i+','+j;
        	ball_html += '<div class="ball" id="p'+i+'_'+j+'" data-x="'+i+'" data-y="'+j+'" data-no="0" >'+debug_text+'</div>';
	 	}
	}
	MatrixArea.innerHTML = ball_html;
}
/**
* 將遊戲數值更新到UI上
*/
function updateGameStateToUi(){
	document.querySelector('#set_amount').innerText = SetAmount;
	document.querySelector('#ball_amount').innerText = BallAmount;
	document.querySelector('#score_count').innerText = ScoreCount;
	//update matrix
	for (var i=0;i<MATRIX_WIDTH;i++) {
    	for(var j=0;j<MATRIX_HEIGHT;j++){
        	document.querySelector('#p'+i+'_'+j).dataset['no'] = Matrix[i][j];
	 	}
	}
}
/**
* 根據計算消除的數量計算分數
* @param object[] points
*/
function calculateScore(points){
	ScoreCount += (10+points.length*5) * points.length;
}

/**
* 計算剩餘組數
*/
function calSetAmount(){
	SetAmount = 0;
	BallAmount = 0;
	let unchecked_matrix = [];
	for (var i=0;i<MATRIX_WIDTH;i++) {
    	unchecked_matrix[i] = [];
    	for(var j=0;j<MATRIX_HEIGHT;j++){
    		unchecked_matrix[i][j] = Matrix[i][j] != 0;
    		if(Matrix[i][j] != 0) {BallAmount++;}
    	}
    }
    for (var i=0;i<MATRIX_WIDTH;i++) {
    	for(var j=0;j<MATRIX_HEIGHT;j++){
    		if(unchecked_matrix[i][j]){
    			let points = findTogetherBall(i,j);
    			if(points.length > 0){
    				SetAmount++;
    			}
    			points.forEach(x=>{
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
function removeFromMatrix(points){
	//將點位歸零
	for(var i=0;i<points.length;i++){
		setMatrixValue(points[i], 0);
	}
	
	let check_width = MATRIX_WIDTH;
	for (var i=0;i<check_width;i++) {
		var row = Matrix[i].filter(function(item, index, array){
			return item != 0;
		});
		if(row.length == 0){
			//整行都是0，要移到最後一行，並少檢查一行
			Matrix.push(Matrix.splice(i, 1)[0]);
			//因為向前移一行，所以同一行再檢查一次
			i--;
			//最後一行全部是0則不檢查
			check_width--;
		}else{
			var changed = false;
			//若0的上面有顏色，讓他往下移動
			while(row.length < MATRIX_HEIGHT){
				row.unshift(0);
				changed = true;
			}
			if(changed){
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
function findTogetherBall(x,y){
	var value = getMatrixValue([x, y]);
	if(value == 0){return [];}
	var new_points = [[x,y]];
	var checked_points = [];
	
	while(new_points.length > 0){
		var handle_point = new_points.pop();
		var near_point = [];
		//左邊
		if(handle_point[0] > 0){
			near_point = [handle_point[0]-1, handle_point[1]]
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		//右邊
		if(handle_point[0] < MATRIX_WIDTH-1){
			near_point = [handle_point[0]+1, handle_point[1]]
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		//上面
		if(handle_point[1] > 0){
			near_point = [handle_point[0], handle_point[1]-1];
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		//下面
		if(handle_point[1] < MATRIX_HEIGHT-1){
			near_point = [handle_point[0], handle_point[1]+1];
			if(getMatrixValue(near_point) == value && !inArray(near_point, checked_points)){
				new_points.push(near_point);
			}
		}
		if(!inArray(handle_point, checked_points)){
			checked_points.push(handle_point);
		}
	}
	if(checked_points.length == 1){
		checked_points.pop();
	}
	return checked_points;
}

function hintBall(points){
	points.forEach(x=>{
		var p = document.querySelector('#p'+x[0]+'_'+x[1]);
		if(p == null){
			console.log("null point: "+x[0]+","+x[1]);
		}else{
			p.classList.add('ball_clickable');
		}
	});
}

function unhintBall(points){
	points.forEach(x=>{
		var p = document.querySelector('#p'+x[0]+'_'+x[1]);
		if(p == null){
			console.log("null point: "+x[0]+","+x[1]);
		}else{
			p.classList.remove('ball_clickable');
		}
	});
}

function getMatrixValue(point){
	return Matrix[point[0]][point[1]];
}

function setMatrixValue(point, value){
	Matrix[point[0]][point[1]] = value;
}
/**
* item是否在positions陣列內
* @param object item
* @param object[] points
* 
* @return bool
*/
function inArray(item, points){
	return points.some(x=>x[0] == item[0] && x[1] == item[1]);
}
/**
* 產生min到max之間的亂數
* @param int min
* @param int max
* 
* @return int
*/
function getRandom(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
};