// Pengganti supabase-js untuk uji lokal (CDN tidak terjangkau). Hanya fitur yang dipakai admin.js.
(function(){
  var KEY='sbstub';
  window.supabase={createClient:function(url,key){
    var get=function(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
    return {
      storage:{from:function(bk){return {upload:async function(path,blob){var r=await fetch(url+'/storage/v1/object/'+bk+'/'+path,{method:'POST',body:blob});return r.ok?{data:{path:path},error:null}:{error:{message:'upload gagal'}};}};}},
      auth:{
        signInWithPassword:async function(c){
          var r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify(c)});
          var j=await r.json(); if(!r.ok) return {error:{message:j.error_description||'gagal'}};
          localStorage.setItem(KEY,JSON.stringify(j)); return {data:{session:j},error:null};},
        getSession:async function(){return {data:{session:get()}};},
        signOut:async function(){localStorage.removeItem(KEY);return {error:null};},
        updateUser:async function(p){var s=get();var r=await fetch(url+'/auth/v1/user',{method:'PUT',headers:{apikey:key,authorization:'Bearer '+s.access_token,'content-type':'application/json'},body:JSON.stringify(p)});return r.ok?{error:null}:{error:{message:'gagal'}};}
      },
      from:function(t){
        var tok=function(){var s=get();return s&&s.access_token;};
        var q={method:'GET',params:[],body:null,head:false,single:false,count:false};
        var run=async function(){
          var u=url+'/rest/v1/'+t+'?'+q.params.join('&');
          var h={apikey:key,authorization:'Bearer '+tok(),'content-type':'application/json'};
          if(q.single)h.accept='application/vnd.pgrst.object+json'; if(q.count)h.Prefer='count=exact';
          var r=await fetch(u,{method:q.head?'HEAD':q.method,headers:h,body:q.body?JSON.stringify(q.body):undefined});
          if(q.head){var cr=r.headers.get('content-range')||'';return {count:+cr.split('/')[1]||0,error:null};}
          var j=null;try{j=await r.json();}catch(e){}
          if(!r.ok)return {data:null,error:{message:(j&&j.message)||'gagal'}};
          return {data:j,error:null};};
        var b={
          select:function(c,o){q.params.push('select='+(c||'*'));if(o&&o.head)q.head=true;if(o&&o.count)q.count=true;return b;},
          order:function(c){q.params.push('order='+c);return b;},
          eq:function(c,v){q.params.push(c+'=eq.'+v);return b;},
          single:function(){q.single=true;return b;},
          update:function(o){q.method='PATCH';q.body=o;return b;},
          upsert:function(o){q.method='POST';q.body=o;q.params.push('on_conflict=key');return b;},
          then:function(a,c){return run().then(a,c);}
        };
        return b;}
    };
  }};
  window.supabase.__storage=true;
})();
