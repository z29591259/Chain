/**
* An easy tool makes preload assets convenient, generate image or audio object, 
* and support onprogress event when any asset loaded, also support onloaderror 
* event when get trouble.
*/
class AssetLoader{
	AssetSrcDictionary = {};
	AssetDictionary = {};
	SuccessCount = 0;
	ErrorCount = 0;
	TotalCount = 0;
	OnLoadError;
	OnLoadErrorCallback;
	OnProgress;
	OnProgressCallback;
	
	constructor(assetSrcDictionary){
		this.AssetSrcDictionary = assetSrcDictionary;
		this._preloadAsset();
	}
	
	_preloadAsset(){
		for (let key in this.AssetSrcDictionary){
			if(this.IsAudio(this.AssetSrcDictionary[key])){
				this.TotalCount++;
				const sound = document.createElement('audio');
				sound.preload = 'auto';
				sound.oncanplaythrough = ()=>{
					this.OnProgress(key)
				};
				sound.src = this.AssetSrcDictionary[key];
				sound.load();
				this.AssetDictionary[key] = sound;
			}else if(this.IsImage(this.AssetSrcDictionary)){
				this.TotalCount++;
				const image = new Image();
				if(image.complete){
					this.OnProgress(key);
				}
				image.onload = ()=>{
					this.OnProgress(key);
				};
				image.onerror = ()=>{
					this.OnLoadError(key);
				};
				image.src = this.AssetSrcDictionary[key];
				this.AssetDictionary[key] = image;
			}
			else{
				console.log('unknow source: ' + key + '=>' + this.AssetSrcDictionary[key]);
			}
		}
	}
	
	startUntilEnd(){
		return this;
	}
	
	startUntilError(){
		return this;
	}
	
	OnProgress(key){
		//計算總進度和回報key
		this.SuccessCount++;
		const percent = Math.floor(this.SuccessCount * 100 / this.TotalCount);
		this.OnProgressCallback(key, percent, this.SuccessCount, this.TotalCount);
	}
	
	OnLoadError(key){
		this.ErrorCount++;
		this.OnLoadErrorCallback(key, this.ErrorCount, this.TotalCount);
	}
	
	IsAudio(filename){
		const audio_ext = ['mp3', 'ogg', 'aac'];
		let tmp = filename.split('.');
		let ext = tmp[tmp.length - 1];
		return audio_ext.indexOf(ext) > 0;
	}
	
	IsImage(filename){
		const image_ext = ['jpg', 'jpeg', 'gif', 'png'];
		let tmp = filename.split('.');
		let ext = tmp[tmp.length - 1];
		return audio_ext.indexOf(ext) > 0;
	}
	
	/**
	* set callback for load error occured, func(key, errorCount, totalCount)
	* @var func callback
	*/
	LoadError(callback){
		if(callback && typeof callback === "function"){
			this.OnLoadError = callback;
		}
		return this;
	}
	
	/**
	* set callback for load success, func(key, percent, successCount, totalCount)
	* @var func callback
	*/
	Progress(callback){
		if(callback && typeof callback === "function"){
			this.OnProgressCallback = callback;
		}
		return this;
	};
	
	getAsset(key){
		if(this.AssetDictionary[key] === undefined){
			return null;
		}
		return this.AssetDictionary[key];
	}
}