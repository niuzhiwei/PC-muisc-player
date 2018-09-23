var EventCenter = {
    on:function(type,handler){
        $(document).on(type,handler)
    },
    fire:function(type,data){
        $(document).trigger(type,data)
    }
}




var Footer={
    init:function(){
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.fa-chevron-left')
        this.$rightBtn = this.$footer.find('.fa-chevron-right')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },

    bind:function(){
        var _this = this
        $(window).resize(function(){
            _this.setStyle()
        })
        this.$rightBtn.on('click',function(){
            if(_this.isAnimate) return
        var itemWidth = _this.$box.find('li').outerWidth(true)
         var rowCount=  Math.floor(_this.$box.width()/itemWidth)
         if(!_this.isToEnd){
             _this.isAnimate = true
            _this.$ul.animate({
                left:'-='+rowCount*itemWidth
              },400,function(){
                  _this.isAnimate = false
                  _this.isToStart = false
                  if(parseFloat(_this.$box.width())-parseFloat(_this.$ul.css('left'))>=parseFloat(_this.$ul.css('width'))){
                      _this.isToEnd = true
                  }   
              })
         }
        })

        this.$leftBtn.on('click',function(){
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowCount=  Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToStart){
                _this.isAnimate = true
                _this.$ul.animate({
                    left:'+='+rowCount*itemWidth
                },400,function(){
                    _this.isAnimate = false
                    _this.isToEnd = false
                    if(_this.$ul.css('left')>=0){
                        isToStart=true
                    }
                })
            }
        })

        this.$footer.on('click','li',function(){
            $(this).addClass('active')
            .siblings().removeClass('active')

            EventCenter.fire('select-albumn',{
                channelId:$(this).attr('data-channel-id'),
                channelName:$(this).attr('data-channel-name')
            })
        })
    },
    render(){
        var _this = this
        $.ajax({
        url:'http://api.jirengu.com/fm/getChannels.php',
        type:'GET',
        dataType:'JSON',
        xhrFields: 
            {'Access-Control-Allow-Origin': '*' }}
    ).done(function(ret){
        _this.renderFooter(ret.channels)
    }).fail(function(){
        console.log('error')
    })
    },
    
    renderFooter:function(channels){
        console.log(channels)
        var html=''
        channels.forEach(function(channel){
            html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
                  + '<div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
                  + '<h3>'+ channel.name +'</h3>'
                  +'</li>'
        })
        this.$footer.find('ul').html(html)
        this.setStyle()
    },
    setStyle:function(){
         var count = this.$footer.find('li').length
         var width = this.$footer.find('li').outerWidth(true)
         this.$footer.find('ul').css({
             width: count*width+'px'
         })
    }

}


var Fm = {
    init:function(){
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.bind()

    },
    bind:function(){
        var _this=this
        EventCenter.on('select-albumn',function(e,channelObj){
            _this.channelId = channelObj.channelId
            _this.channelName = channelObj.channelName
            _this.loadMusic(function(){
                _this.setMusic()
            })
        })

        this.$container.find('.btn-play').on('click',function(){
            var $btn = $(this)
            if($btn.hasClass('fa-play')){
                $btn.removeClass('fa-play').addClass('fa-pause')
                _this.audio.play()
            }else{
                $btn.removeClass('fa-pause').addClass('fa-play') 
                _this.audio.pause()
            }
        })

        this.$container.find('.btn-next').on('click',function(){
        _this.loadMusic()
        })

        this.audio.onplay = function(){
            clearInterval(_this.statusClock)
            _this.statusClock = setInterval(function(){
                _this.updataStatus()
            },1000)
        }
        this.audio.onpause = function(){
            clearInterval(_this.statusClock)
        }
    },
    loadMusic(callback){
        var _this = this
       $.ajax({url:'http://api.jirengu.com/fm/getSong.php',
       type:'GET',
       dataType:'JSON',
       data:
       {channel:this.channelId},
       xhrFields: {  
        'Access-Control-Allow-Origin': '*' }
    }).done(function(ret){
           _this.song = ret['song'][0]
           _this.setMusic()
           _this.loadLyirc()
       })
    },
    loadLyirc(){
        var _this = this
       $.ajax({url:'http://jirenguapi.applinzi.com/fm/getLyric.php',
       type:'GET',
       dataType:'JSON',
       data:{sid:this.song.sid},
       xhrFields: {  
        'Access-Control-Allow-Origin': '*' } } ).done(function(ret){
           console.log(ret.lyric)
           var lyric = ret.lyric
           var lyricObj = {}
           lyric.split('\n').forEach(function(line){
              var times = line.match(/\d{2}:\d{2}/g)
              var str = line.replace(/\[.+?\]/g,'')
              if(Array.isArray(times)){
                times.forEach(function(time){
                    lyricObj[time] = str
                  })
              }
           })
           _this.lyricObj = lyricObj
       })
    },

    setMusic(){
       this.audio.src = this.song.url
       $('.bg').css('background-image','url('+this.song.picture+')')
       this.$container.find('.aside figure').css('background-image','url('+this.song.picture+')')
       this.$container.find('.detail h1').text(this.song.title)
       this.$container.find('.detail .author').text(this.song.artist)
       this.$container.find('.detail .tag').text(this.channelName)
       this.$container.find('.btn-play').removeClass('fa-play').addClass('fa-pause')
    },
    updataStatus(){
        var min = Math.floor(this.audio.currentTime/60)
        var second = Math.floor(Fm.audio.currentTime%60)+''
        second = second.length ===2?second:'0'+second
        this.$container.find('.current-time').text(min+':'+second)
        this.$container.find('.bar-progress').css('width',
        this.audio.currentTime/this.audio.duration*100+'%')

        var line = this.lyricObj['0'+min+':'+second]
        if(line){
            this.$container.find('.lyric p').text(line)
        }
    }
}

Footer.init()
Fm.init()


