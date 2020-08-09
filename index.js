var gameArea;
var matrixArea;
const MATRIX_WIDTH = 12;
const MATRIX_HEIGHT = 12;
var Matrix = [];
function onload(){
	gameArea = document.getElementById('game_area');
	matrixArea = document.getElementById('matrix_area');
	resizeGameArea();
	startNewGame();
		
	document.querySelectorAll('.ball').forEach(x=>x.onmouseenter=function(e){
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		hintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x=>x.onmouseout=function(e){
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		unhintBall(points);
	});
	document.querySelectorAll('.ball').forEach(x=>x.onclick=function(e){
		var points = findTogetherBall(
			parseInt(e.target.dataset['x'], 10), 
			parseInt(e.target.dataset['y'], 10));
		removeBall(points);
		unhintBall(points);
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
	    gameArea.style.height = newHeight + 'px';
	    gameArea.style.width = newWidth + 'px';
	} else {
	    newHeight = newWidth / widthToHeight;
	    gameArea.style.width = newWidth + 'px';
	    gameArea.style.height = newHeight + 'px';
	}
			    
	gameArea.style.marginTop = (-newHeight / 2) + 'px';
	gameArea.style.marginLeft = (-newWidth / 2) + 'px';		
}

function startNewGame(){
	for (var i=0;i<MATRIX_WIDTH;i++) {
		Matrix[i] = [];
		for(var j=0;j<MATRIX_HEIGHT;j++){
			Matrix[i][j] = getRandom(1,5);
		}
	}
	renderMatrix();
}

function renderMatrix(){
	var ball_html = '';
	for (var i=0;i<MATRIX_WIDTH;i++) {
    	for(var j=0;j<MATRIX_HEIGHT;j++){
        	var debug_text = '';
        	//debug_text = i+','+j;
        	ball_html += '<div class="ball" data-x="'+i+'" data-y="'+j+'" data-no="' + Matrix[i][j] + '" >'+debug_text+'</div>';
	 	}
	}
	matrixArea.innerHTML = ball_html;
}

/**
* 消除點選的同色球，並重新排列
* @param object[] points
*/
function removeBall(points){
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
			//修改dom的data-no
			for(var j=i;j<check_width;j++){
				Matrix[j].forEach((item, index)=>{
					//修改dom的data-no
					var p = document.querySelector(".ball[data-x='"+j+"'][data-y='"+index+"']");
					p.dataset['no'] = Matrix[j][index];
				})
			}
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
				row.forEach((item, index)=>{
					//修改dom的data-no
					var p = document.querySelector(".ball[data-x='"+i+"'][data-y='"+index+"']");
					p.dataset['no'] = Matrix[i][index];
				});
			}
		}
	}
}

/**
* 分階段尋找，每次都找相鄰的點，一次一次擴散，並且比對不和之前的點重複，避免無窮迴圈
* @param int x
* @param int y
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
		var p = document.querySelector(".ball[data-x='"+x[0]+"'][data-y='"+x[1]+"']");
		if(p == null){
			console.log("null point: "+x[0]+","+x[1]);
		}else{
			p.classList.add('ball_clickable');
		}
	});
}

function unhintBall(points){
	points.forEach(x=>{
		var p = document.querySelector(".ball[data-x='"+x[0]+"'][data-y='"+x[1]+"']");
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