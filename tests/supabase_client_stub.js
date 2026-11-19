// Pengganti supabase-js untuk uji lokal (CDN tidak terjangkau). Hanya fitur yang dipakai admin.js.
(function(){
  var KEY='sbstub';
  window.supabase={createClient:function(url,key){
    var get=function(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
    return {
      auth:{
        signInWithPassword:async function(c){
          var r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify(c)});
          var j=await r.json(); if(!r.ok) return {error:{message:j.error_description||'gagal'}};
          localStorage.setItem(KEY,JSON.stringify(j)); return {data:{session:j},error:null};},
        getSession:async function(){return {data:{session:get()}};},
        signOut:async function(){localStorage.removeItem(KEY);return {error:null};},
        updateUser:async function(p){var s=get();var r=await fetch(url+'/auth/v1/user',{method:'PUT',headers:{apikey:key,authorization:'Bearer '+s.access_token,'content-type':'application/json'},body:JSON.stringify(p)});return r.ok?{error:null}:{error:{message:'gagal'}};}
      },
      from:function(t){return {select:async function(){var s=get();var r=await fetch(url+'/rest/v1/'+t+'?select=id',{method:'HEAD',headers:{apikey:key,authorization:'Bearer '+(s&&s.access_token),Prefer:'count=exact'}});
        var cr=r.headers.get('content-range')||'';return {count:+cr.split('/')[1]||0,error:null};}};}
    };
  }};
})();
