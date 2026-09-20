const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];

const PHOTO_SETS={
  suv:'/assets/cars/11111111-1111-4111-8111-111111111111/',
  sedan:'/assets/cars/22222222-2222-4222-8222-222222222222/',
  pickup:'/assets/cars/33333333-3333-4333-8333-333333333333/',
  crossover:'/assets/cars/44444444-4444-4444-8444-444444444444/'
};
function photoSet(c){
  const key=(c.body||'').toLowerCase();
  if(key.includes('pickup')) return PHOTO_SETS.pickup;
  if(key.includes('sedan')) return PHOTO_SETS.sedan;
  if(key.includes('hatch')) return PHOTO_SETS.sedan;
  if(key.includes('suv')) return (String(c.make||'').toLowerCase().includes('bmw')||String(c.make||'').toLowerCase().includes('mercedes'))?PHOTO_SETS.crossover:PHOTO_SETS.suv;
  return PHOTO_SETS.suv;
}
function carImages(c){return CAR_PHOTOS[c.id]?.length?CAR_PHOTOS[c.id]:[]}

const SUPABASE_URL='https://rbitwptbmwhsvezdkhlk.supabase.co';
const SUPABASE_KEY='sb_publishable_akmd2h4AAq5UD3HOlpQm3g_m_AL3Rxd';
const supabaseClient=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
let authUser=null, profile=null, CARS=[], current=[];
let CAR_PHOTOS={};
let favourites=JSON.parse(localStorage.getItem('ger_favourites')||'[]');
let compare=[]; localStorage.removeItem('ger_compare');
function money(n){return 'TZS '+Number(n||0).toLocaleString('en-TZ')}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>t.classList.remove('show'),2500)}
function navCounts(){$('#compareCount').textContent=compare.length}
function syncCompareWithCars(){const valid=new Set(CARS.map(c=>c.id));compare=compare.filter(id=>valid.has(id));navCounts();renderCompare();}
function carCard(c){const fav=favourites.includes(c.id),cmp=compare.includes(c.id),imgs=carImages(c);return `<article class="car-card"><div class="car-photo"><img class="car-main-image" data-main-image="${c.id}" src="${imgs[0]}" alt="${c.make} ${c.model}" loading="lazy"><span class="badge">${c.featured?'FEATURED':'GER VERIFIED'}</span><button class="fav ${fav?'active':''}" data-fav="${c.id}" aria-label="Favourite">${fav?'♥':'♡'}</button></div><div class="photo-strip">${imgs.map((src,i)=>`<button class="photo-thumb ${i===0?'active':''}" data-photo-target="${c.id}" data-photo="${src}"><img src="${src}" alt="${c.make} ${c.model} photo ${i+1}" loading="lazy"></button>`).join('')}<span class="photo-count">${imgs.length} photos</span></div><div class="car-info"><div class="car-title"><h3>${c.make} ${c.model}</h3><span class="price">${money(c.price)}</span></div><div class="meta"><span>${c.year}</span><span>${Number(c.mileage||0).toLocaleString()} KM</span><span>${c.transmission||'—'}</span><span>${c.fuel||'—'}</span><span>${c.location||'—'}</span></div><div class="card-actions"><button class="btn ghost" data-detail="${c.id}">View Details</button><button class="btn compare-btn" data-compare="${c.id}">${cmp?'✓ Compared':'Compare'}</button></div></div></article>`}
function renderCars(){const grid=$('#carGrid');grid.innerHTML=current.map(carCard).join('');$('#emptyState').hidden=current.length>0;bindCards()}
function renderFavs(){const grid=$('#favGrid');const arr=CARS.filter(c=>favourites.includes(c.id));grid.innerHTML=arr.map(carCard).join('');$('#favEmpty').style.display=arr.length?'none':'block';bindCards()}
async function toggleFavourite(id){
 try{
   if(favourites.includes(id)){
     if(authUser){const {error}=await supabaseClient.from('favourites').delete().eq('user_id',authUser.id).eq('car_id',id);if(error)throw error;}
     favourites=favourites.filter(x=>x!==id);toast('Removed from your favourites');
   }else{
     if(authUser){const {error}=await supabaseClient.from('favourites').insert({user_id:authUser.id,car_id:id});if(error)throw error;}
     favourites.push(id);toast(authUser?'Saved to your account':'Saved to your favourites');
   }
   localStorage.setItem('ger_favourites',JSON.stringify(favourites));renderCars();renderFavs();
 }catch(err){toast(err.message||'Could not update favourite')}
}
function bindCards(){
 $('[data-fav]').forEach(b=>b.onclick=()=>toggleFavourite(b.dataset.fav));
 $('[data-compare]').forEach(b=>b.onclick=()=>{const id=b.dataset.compare;if(compare.includes(id))compare=compare.filter(x=>x!==id);else if(compare.length<4)compare.push(id);else return toast('Compare limit is 4 cars');localStorage.setItem('ger_compare',JSON.stringify(compare));navCounts();renderCars();renderCompare()});
 $$('[data-detail]').forEach(b=>b.onclick=()=>openDetail(b.dataset.detail));
 $$('[data-photo-target]').forEach(b=>b.onclick=()=>{const id=b.dataset.photoTarget;const main=document.querySelector(`[data-main-image="${id}"]`);if(main){main.src=b.dataset.photo;$$(`[data-photo-target="${id}"]`).forEach(x=>x.classList.remove('active'));b.classList.add('active')}});
}
function renderCompare(){navCounts();const box=$('#compareBox');const arr=CARS.filter(c=>compare.includes(c.id));if(!arr.length){box.innerHTML='<p>Select two or more cars using <b>Compare</b> on a listing.</p>';return}box.innerHTML=`<table class="compare-table"><tr><th>Specification</th>${arr.map(c=>`<th>${c.make} ${c.model}</th>`).join('')}</tr>${[['Price',c=>money(c.price)],['Year',c=>c.year],['Mileage',c=>Number(c.mileage||0).toLocaleString()+' KM'],['Condition',c=>c.condition],['Fuel',c=>c.fuel],['Transmission',c=>c.transmission],['Body Type',c=>c.body],['Location',c=>c.location]].map(([l,f])=>`<tr><td><b>${l}</b></td>${arr.map(c=>`<td>${f(c)}</td>`).join('')}</tr>`).join('')}</table>`}
function openDetail(id){const c=CARS.find(x=>x.id===id);if(!c)return;const imgs=carImages(c);const specs=[['Make',c.make],['Model',c.model],['Year',c.year],['Condition',c.condition],['Price',money(c.price)],['Mileage',c.mileage?Number(c.mileage).toLocaleString()+' KM':'—'],['Fuel',c.fuel],['Transmission',c.transmission],['Body Type',c.body],['Engine',c.engine_cc?Number(c.engine_cc).toLocaleString()+' cc':'—'],['Drive Type',c.drive_type],['Doors',c.doors],['Seats',c.seats],['Exterior Colour',c.exterior_color],['Interior Colour',c.interior_color],['Registration Year',c.registration_year],['Import Year',c.import_year],['Ownership',c.ownership],['Warranty',c.warranty],['Negotiable',c.negotiable?'Yes':'No'],['Location',c.location]].filter(x=>x[1]!==undefined&&x[1]!==null&&x[1]!=='');const blocks=[['Description',c.description],['Condition / Inspection Notes',c.condition_notes],['Service History',c.service_history],['Accident History',c.accident_history],['Key Features',c.features],['Documents Available',c.documents]].filter(x=>x[1]);$('#modalContent').innerHTML=`<div class="detail-grid"><div><img id="detailMainImage" class="detail-main-image" src="${imgs[0]}" alt="${c.make} ${c.model}"><div class="detail-gallery">${imgs.map((src,i)=>`<button class="detail-thumb ${i===0?'active':''}" data-detail-photo="${src}"><img src="${src}" alt="${c.make} ${c.model} photo ${i+1}"></button>`).join('')}</div></div><div class="detail-info"><span class="eyebrow">${c.featured?'FEATURED • ':''}GER VERIFIED</span><h2>${c.make} ${c.model}</h2><div class="big">${money(c.price)}</div><p>${c.year||'—'} • ${Number(c.mileage||0).toLocaleString()} KM • ${c.transmission||'—'} • ${c.fuel||'—'}</p><p>📍 ${c.location||'—'} · Seller: ${c.seller||'GER Verified Seller'}</p><div class="detail-actions"><a class="btn primary" target="_blank" href="https://wa.me/255744211545?text=${encodeURIComponent('Hello GER Cars Tanzania, I am interested in '+c.make+' '+c.model+', Listing ID '+c.id+'.')}">WhatsApp</a><a class="btn ghost" href="tel:+255744211545">Call</a></div></div></div><hr><h3>Vehicle Information</h3><div class="vehicle-spec-grid">${specs.map(([l,v])=>`<div><small>${l}</small><b>${v}</b></div>`).join('')}</div>${blocks.map(([l,v])=>`<div class="vehicle-text"><h3>${l}</h3><p>${String(v).replace(/\n/g,'<br>')}</p></div>`).join('')}<hr><h3>Send an enquiry</h3><form id="carEnquiryForm" class="contact-form"><input name="name" required placeholder="Your name" value="${profile?.full_name||''}"><input name="phone" placeholder="Phone number" value="${profile?.phone||''}"><input name="email" type="email" placeholder="Email" value="${authUser?.email||''}"><textarea name="message" required placeholder="I am interested in this vehicle.">I am interested in the ${c.make} ${c.model} (Listing ${c.id}). Please contact me.</textarea><button class="btn primary" type="submit">Send Enquiry</button></form>`;$('#modal').hidden=false;$$('[data-detail-photo]').forEach(b=>b.onclick=()=>{$('#detailMainImage').src=b.dataset.detailPhoto;$$('[data-detail-photo]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});$('#carEnquiryForm').onsubmit=e=>submitCarEnquiry(e,c)}
async function submitCarEnquiry(e,c){e.preventDefault();const f=new FormData(e.target);const btn=e.target.querySelector('button');btn.disabled=true;try{const {error}=await supabaseClient.from('enquiries').insert({car_id:c.id,customer_id:authUser?.id||null,customer_name:String(f.get('name')||''),customer_phone:String(f.get('phone')||''),customer_email:String(f.get('email')||authUser?.email||''),message:String(f.get('message')||''),channel:'website',status:'new'});if(error)throw error;closeModal();toast('Enquiry sent successfully');}catch(err){toast(err.message||'Could not send enquiry')}finally{btn.disabled=false}}
function applyFilters(){const q=$('#searchInput').value.toLowerCase().trim(),make=$('#makeFilter').value,condition=$('#conditionFilter').value.toLowerCase(),loc=$('#locationFilter').value;current=CARS.filter(c=>(!q||`${c.make} ${c.model}`.toLowerCase().includes(q))&&(!make||c.make===make)&&(!condition||c.condition.toLowerCase()===condition)&&(!loc||c.location===loc));sortCars();renderCars()}
function sortCars(){const s=$('#sortSelect').value;if(s==='low')current.sort((a,b)=>a.price-b.price);if(s==='high')current.sort((a,b)=>b.price-a.price);if(s==='mileage')current.sort((a,b)=>(a.mileage||0)-(b.mileage||0));if(s==='newest')current.sort((a,b)=>b.year-a.year)}
function monthly(){const P=Math.max(0,Number($('#loanPrice').value||0)-Number($('#loanDeposit').value||0)),r=Number($('#loanRate').value||0)/100/12,n=Number($('#loanYears').value||1)*12;const m=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;$('#monthlyPayment').textContent=money(Math.round(m))}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').hidden=false}function closeModal(){$('#modal').hidden=true}
function authModal(mode='login'){const signup=mode==='signup';openModal(`<span class="eyebrow">GER CARS TANZANIA</span><h2>${signup?'Create Account':'Login'}</h2><p>${signup?'Create a customer account to save cars and manage your marketplace activity.':'Login to your GER Cars Tanzania account.'}</p><form id="authForm" class="contact-form" autocomplete="off"><input id="authName" ${signup?'required':''} placeholder="Full name" ${signup?'':'hidden'}><input id="authPhone" placeholder="Phone number" ${signup?'':'hidden'}><input id="authEmail" required type="email" autocomplete="off" placeholder="Email address"><input id="authPassword" required minlength="6" type="password" autocomplete="new-password" placeholder="Password"><button class="btn primary" type="submit">${signup?'Create Account':'Login'}</button><button class="btn ghost" type="button" id="authSwitch">${signup?'Already have an account? Login':'New here? Create an account'}</button></form>`);$('#authSwitch').onclick=()=>authModal(signup?'login':'signup');$('#authForm').onsubmit=async e=>{e.preventDefault();if(!supabaseClient)return toast('Backend configuration is unavailable.');const email=$('#authEmail').value.trim(),password=$('#authPassword').value,btn=e.target.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Please wait…';try{if(signup){const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{full_name:$('#authName').value.trim(),phone:$('#authPhone').value.trim()}}});if(error)throw error;closeModal();toast(data.session?'Account created and logged in':'Account created. Check your email to confirm your account.')}else{const {error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error;closeModal();toast('Login successful')}}catch(err){toast(err.message||'Authentication failed')}finally{btn.disabled=false;btn.textContent=signup?'Create Account':'Login'}}}
async function loadCars(){
 if(!supabaseClient)return;
 const {data,error}=await supabaseClient.from('cars').select('*').eq('status','active').order('created_at',{ascending:false});
 if(error){toast(error.message||'Could not load vehicles');return;}
 CARS=(data||[]).map(x=>({id:x.id,make:x.make,model:x.model,year:x.year,price:Number(x.price),mileage:x.mileage||0,condition:x.condition==='new'?'New':'Used',location:x.location||'',fuel:x.fuel_type||'',transmission:x.transmission||'',body:x.body_type||'',featured:x.featured,seller:'GER Verified Seller',description:x.description||'',engine_cc:x.engine_cc,drive_type:x.drive_type,doors:x.doors,seats:x.seats,exterior_color:x.exterior_color,interior_color:x.interior_color,registration_year:x.registration_year,import_year:x.import_year,ownership:x.ownership,service_history:x.service_history,accident_history:x.accident_history,condition_notes:x.condition_notes,features:x.features,documents:x.documents,warranty:x.warranty,negotiable:x.negotiable}));
 current=[...CARS];
 await loadCarPhotos();
}
async function loadProfile(){if(!authUser)return;const {data}=await supabaseClient.from('profiles').select('*').eq('id',authUser.id).maybeSingle();profile=data||{id:authUser.id,full_name:authUser.user_metadata?.full_name||'',phone:authUser.user_metadata?.phone||'',role:'customer'};}
async function loadFavourites(){if(!authUser){favourites=JSON.parse(localStorage.getItem('ger_favourites')||'[]');renderCars();renderFavs();return}const {data,error}=await supabaseClient.from('favourites').select('car_id').eq('user_id',authUser.id);if(!error){favourites=(data||[]).map(x=>x.car_id);localStorage.setItem('ger_favourites',JSON.stringify(favourites));renderCars();renderFavs()}}
async function loadCarPhotos(){
 if(!supabaseClient || !CARS.length){CAR_PHOTOS={};current=[];renderCars();renderFavs();renderCompare();return}
 CAR_PHOTOS={};
 const results=await Promise.all(CARS.map(async c=>{
   const {data,error}=await supabaseClient.from('car_images').select('public_url,sort_order').eq('car_id',c.id).not('public_url','is',null).order('sort_order',{ascending:true});
   return {id:c.id,data:data||[],error};
 }));
 const failed=results.find(x=>x.error);
 if(failed){toast(failed.error.message||'Could not load vehicle photos');return}
 results.forEach(x=>{
   const urls=x.data.map(row=>String(row.public_url||'').trim()).filter(url=>/^https:\/\//i.test(url));
   if(urls.length)CAR_PHOTOS[x.id]=urls;
 });
 // Every active vehicle is shown. If it has dealer-uploaded photos, use only those real photos.
 // Vehicles without photos remain visible but never receive a fake/default vehicle image.
 renderCars();renderFavs();renderCompare();
}
async function createListing(form){
 if(!authUser)return authModal('login');
 const fd=new FormData(form);const btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Uploading…';
 try{
   const fileInput=form.querySelector('input[type=file]');
   const files=[...fileInput.files];
   if(!files.length)throw new Error('Please select at least one car photo.');
   if(files.length>12)throw new Error('You can upload up to 12 photos per car.');
   const invalid=files.find(file=>!file.type.startsWith('image/'));
   if(invalid)throw new Error('Only image files are allowed.');
   const oversized=files.find(file=>file.size>10*1024*1024);
   if(oversized)throw new Error('Each photo must be 10 MB or smaller.');
   const make=String(fd.get('make')||'').trim(),model=String(fd.get('model')||'').trim();
   if(!make||!model)throw new Error('Make and model are required.');
   const {data:car,error}=await supabaseClient.from('cars').insert({seller_id:authUser.id,title:`${make} ${model}`,make,model,year:Number(fd.get('year')||0),condition:String(fd.get('condition')||'used').toLowerCase(),price:Number(fd.get('price')||0),location:String(fd.get('location')||''),mileage:Number(fd.get('mileage')||0),fuel_type:String(fd.get('fuel_type')||''),transmission:String(fd.get('transmission')||''),body_type:String(fd.get('body_type')||''),description:String(fd.get('description')||''),engine_cc:Number(fd.get('engine_cc')||0)||null,drive_type:String(fd.get('drive_type')||''),doors:Number(fd.get('doors')||0)||null,seats:Number(fd.get('seats')||0)||null,exterior_color:String(fd.get('exterior_color')||''),interior_color:String(fd.get('interior_color')||''),registration_year:Number(fd.get('registration_year')||0)||null,import_year:Number(fd.get('import_year')||0)||null,ownership:String(fd.get('ownership')||''),service_history:String(fd.get('service_history')||''),accident_history:String(fd.get('accident_history')||''),condition_notes:String(fd.get('condition_notes')||''),features:String(fd.get('features')||''),documents:String(fd.get('documents')||''),warranty:String(fd.get('warranty')||''),negotiable:fd.get('negotiable')==='on',status:'pending_review',verified:false,featured:false}).select().single();
   if(error)throw error;
   const uploaded=[];
   const uploadedPaths=[];
   try{
     for(let i=0;i<files.length;i++){
       const file=files[i];
       const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-');
       const path=authUser.id+'/'+car.id+'/'+Date.now()+'-'+i+'-'+safe;
       const up=await supabaseClient.storage.from('car-images').upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});
       if(up.error)throw up.error;
       uploadedPaths.push(path);
       const url=supabaseClient.storage.from('car-images').getPublicUrl(path).data.publicUrl;
       const ins=await supabaseClient.from('car_images').insert({car_id:car.id,storage_path:path,public_url:url,sort_order:i});
       if(ins.error)throw ins.error;
       uploaded.push(url);
     }
   }catch(uploadErr){
     if(uploadedPaths.length)await supabaseClient.storage.from('car-images').remove(uploadedPaths);
     await supabaseClient.from('car_images').delete().eq('car_id',car.id);
     await supabaseClient.from('cars').delete().eq('id',car.id).eq('seller_id',authUser.id);
     throw uploadErr;
   }
   closeModal();toast('Car submitted successfully. It is pending review before publication.');
   await loadMyListings();
 }catch(err){toast(err.message||'Could not create listing')}finally{btn.disabled=false;btn.textContent='Submit Listing'}
}
async function loadMyListings(){
 if(!authUser)return [];
 const {data,error}=await supabaseClient.from('cars').select('id,make,model,year,price,status,location,created_at').eq('seller_id',authUser.id).order('created_at',{ascending:false});
 if(error)return [];
 return data||[];
}
async function markSold(id){
 const {error}=await supabaseClient.rpc('seller_mark_car_sold',{p_car_id:id});
 if(error)toast(error.message);else{toast('Car marked as sold');await openAccount();}
}
async function deleteSoldCar(id){
 if(!confirm('Delete this sold car permanently? This cannot be undone.'))return;
 try{
   const {data:imgs}=await supabaseClient.from('car_images').select('storage_path').eq('car_id',id);
   const paths=(imgs||[]).map(x=>x.storage_path).filter(Boolean);
   if(paths.length){
     const storageResult=await supabaseClient.storage.from('car-images').remove(paths);
     if(storageResult.error)throw storageResult.error;
   }
   const imageDelete=await supabaseClient.from('car_images').delete().eq('car_id',id);
   if(imageDelete.error)throw imageDelete.error;
   const favDelete=await supabaseClient.from('favourites').delete().eq('car_id',id);
   if(favDelete.error)console.warn('Favourite cleanup:',favDelete.error.message);
   const compareDelete=await supabaseClient.from('comparisons').delete().eq('car_id',id);
   if(compareDelete.error)console.warn('Comparison cleanup:',compareDelete.error.message);
   const enquiryDelete=await supabaseClient.from('enquiries').delete().eq('car_id',id);
   if(enquiryDelete.error)console.warn('Enquiry cleanup:',enquiryDelete.error.message);
   const {data,error}=await supabaseClient.rpc('seller_delete_sold_car',{p_car_id:id});
   if(error)throw error;
   if(!data)throw new Error('The car could not be deleted.');
   const {data:stillThere,error:verifyError}=await supabaseClient.from('cars').select('id').eq('id',id).maybeSingle();
   if(verifyError)throw verifyError;
   if(stillThere)throw new Error('The car is still in the database and was not deleted.');
   delete CAR_PHOTOS[id];
   CARS=CARS.filter(c=>c.id!==id);
   current=current.filter(c=>c.id!==id);
   favourites=favourites.filter(x=>x!==id);
   compare=compare.filter(x=>x!==id);
   localStorage.setItem('ger_favourites',JSON.stringify(favourites));
   navCounts();renderCars();renderFavs();renderCompare();
   toast('Sold car deleted permanently');
   await loadCars();
   await openAccount();
 }catch(err){toast(err.message||'Could not delete sold car')}
}
function openSell(){
 if(!authUser){authModal('login');return}
 openModal(`<span class="eyebrow">LIST YOUR CAR</span><h2>Complete Vehicle Listing</h2><p>Jaza taarifa muhimu ambazo mnunuzi anahitaji kujua. Taarifa hizi zitaonekana kwenye ukurasa wa gari pamoja na picha zako.</p><form id="sellForm" class="contact-form listing-form"><h3>Basic vehicle details</h3><div class="form-row"><input name="make" required placeholder="Make e.g. Toyota"><input name="model" required placeholder="Model e.g. Harrier"></div><div class="form-row"><input name="year" type="number" min="1950" max="2035" required placeholder="Model year"><input name="price" type="number" min="0" required placeholder="Price (TZS)"></div><div class="form-row"><input name="mileage" type="number" min="0" placeholder="Mileage (KM)"><select name="condition"><option value="used">Used</option><option value="new">New</option></select></div><div class="form-row"><select name="fuel_type"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select><select name="transmission"><option>Automatic</option><option>Manual</option></select></div><div class="form-row"><input name="body_type" required placeholder="Body type e.g. SUV"><input name="location" required placeholder="Location e.g. Dar es Salaam"></div><div class="form-row"><input name="engine_cc" type="number" placeholder="Engine size e.g. 2000 cc"><select name="drive_type"><option value="">Drive type</option><option>2WD</option><option>4WD</option><option>AWD</option><option>FWD</option><option>RWD</option></select></div><div class="form-row"><input name="doors" type="number" min="2" max="6" placeholder="Doors"><input name="seats" type="number" min="1" max="20" placeholder="Seats"></div><div class="form-row"><input name="exterior_color" placeholder="Exterior colour"><input name="interior_color" placeholder="Interior colour"></div><h3>Registration & history</h3><div class="form-row"><input name="registration_year" type="number" placeholder="Registration year"><input name="import_year" type="number" placeholder="Import year (if applicable)"></div><input name="ownership" placeholder="Ownership e.g. 1st owner / 2nd owner"><textarea name="service_history" placeholder="Service history — where and when serviced, major maintenance, etc."></textarea><textarea name="accident_history" placeholder="Accident history — state clearly if accident-free or describe any known accident/repair history."></textarea><textarea name="condition_notes" placeholder="Current condition / inspection notes — tyres, engine, body, interior, known faults, etc."></textarea><h3>Features, documents & warranty</h3><textarea name="features" placeholder="Key features — AC, sunroof, reverse camera, leather seats, airbags, cruise control, parking sensors, etc."></textarea><textarea name="documents" placeholder="Documents available — logbook, import documents, service records, inspection report, etc."></textarea><input name="warranty" placeholder="Warranty — e.g. 3 months / manufacturer warranty / None"><label><input name="negotiable" type="checkbox"> Price is negotiable</label><textarea name="description" required placeholder="Full vehicle description for buyers"></textarea><label class="file-label">Car photos (1–12)<input id="carPhotoInput" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple required></label><small class="muted">Select up to 12 real photos. Maximum 10 MB per photo.</small><div id="photoPreview" class="photo-upload-preview"></div><button class="btn primary" type="submit">Submit Listing for Review</button></form>`);
 $('#sellForm').onsubmit=e=>{e.preventDefault();createListing(e.target)};
 const photoInput=$('#carPhotoInput'),preview=$('#photoPreview');
 const renderSelectedPhotos=()=>{
   const files=[...photoInput.files];preview.innerHTML='';
   files.forEach((file,i)=>{
     const box=document.createElement('div');box.className='photo-upload-item';
     const img=document.createElement('img');img.alt='Car photo '+(i+1);img.src=URL.createObjectURL(file);box.appendChild(img);
     const n=document.createElement('span');n.textContent=(i+1);box.appendChild(n);
     const remove=document.createElement('button');remove.type='button';remove.className='photo-remove-btn';remove.textContent='×';remove.title='Remove this photo';remove.dataset.photoIndex=i;box.appendChild(remove);
     preview.appendChild(box);
   });
 };
 photoInput.onchange=()=>{
   const files=[...photoInput.files];
   if(files.length>12){toast('Maximum 12 photos per car.');photoInput.value='';renderSelectedPhotos();return}
   const invalid=files.find(file=>!file.type.startsWith('image/'));
   if(invalid){toast('Only image files are allowed.');photoInput.value='';renderSelectedPhotos();return}
   const oversized=files.find(file=>file.size>10*1024*1024);
   if(oversized){toast('Each photo must be 10 MB or smaller.');photoInput.value='';renderSelectedPhotos();return}
   renderSelectedPhotos();
 };
 preview.onclick=e=>{
   const b=e.target.closest('[data-photo-index]');if(!b)return;
   const index=Number(b.dataset.photoIndex),files=[...photoInput.files];
   files.splice(index,1);
   const dt=new DataTransfer();files.forEach(file=>dt.items.add(file));
   photoInput.files=dt.files;renderSelectedPhotos();
 };
}
async function openAccount(){
 if(!authUser)return authModal('login');
 await loadProfile();
 const {data:enquiries=[]}=await supabaseClient.from('enquiries').select('id,car_id,customer_name,message,status,created_at').eq('customer_id',authUser.id).order('created_at',{ascending:false}).limit(10);
 const rows=enquiries.length?enquiries.map(e=>{const c=CARS.find(x=>x.id===e.car_id);return `<div style="padding:10px 0;border-bottom:1px solid #ddd"><b>${c?c.make+' '+c.model:'Vehicle enquiry'}</b><br><small>${e.status||'new'} · ${new Date(e.created_at).toLocaleString()}</small><br>${e.message}</div>`}).join(''):'<p>No enquiries yet.</p>';
 const listings=await loadMyListings();
 const listingRows=listings.length?listings.map(c=>`<div class="my-listing-row"><div><b>${c.make} ${c.model}</b><br><small>${c.year||''} · ${money(c.price)} · ${c.location||''} · <strong>${c.status}</strong></small></div><div class="listing-actions">${c.status==='active'?`<button class="btn ghost" data-sold="${c.id}">Mark Sold</button>`:''}${c.status==='sold'?`<button class="btn danger" data-delete-sold="${c.id}">Delete Sold Car</button>`:''}</div></div>`).join(''):'<p>No listings yet. Use “List Your Car” to upload one.</p>';
 openModal(`<span class="eyebrow">MY ACCOUNT</span><h2>${profile.full_name||authUser.email}</h2><form id="profileForm" class="contact-form" autocomplete="off"><input name="full_name" required placeholder="Full name" value="${profile.full_name||''}"><input name="phone" placeholder="Phone number" value="${profile.phone||''}"><input value="${authUser.email||''}" disabled><button class="btn primary">Save Profile</button></form><hr><div class="account-section"><h3>My Car Listings</h3><p class="muted">Manage your own listings. A sold car can be permanently deleted.</p><div>${listingRows}</div></div><hr><h3>My Enquiries</h3><div>${rows}</div>${profile.role==='admin'?'<button id="adminReviewBtn" class="btn primary" style="margin-top:16px">ADMIN REVIEW • APPROVE / REJECT</button>':''}<button id="accountLogout" class="btn ghost" style="margin-top:16px">Logout</button>`);
 $('#profileForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await supabaseClient.from('profiles').update({full_name:String(f.get('full_name')),phone:String(f.get('phone'))}).eq('id',authUser.id);if(error)toast(error.message);else{await loadProfile();toast('Profile updated');}};
 $$('[data-sold]').forEach(b=>b.onclick=()=>markSold(b.dataset.sold));
 $$('[data-delete-sold]').forEach(b=>b.onclick=()=>deleteSoldCar(b.dataset.deleteSold));
 if($('#adminReviewBtn'))$('#adminReviewBtn').onclick=loadAdminReview;
 $('#accountLogout').onclick=async()=>{await supabaseClient.auth.signOut();closeModal()};
}
async function loadAdminReview(){
 if(!authUser || profile?.role!=='admin'){toast('Admin access required');return}
 const {data,error}=await supabaseClient.from('cars').select('id,listing_id,make,model,year,price,status,location,seller_id,created_at').eq('status','pending_review').order('created_at',{ascending:false});
 if(error){toast(error.message);return}
 const rows=(data||[]).map(c=>`<div class="my-listing-row"><div><b>${c.make||''} ${c.model||''}</b><br><small>${c.listing_id||'No Listing ID'} · ${money(c.price)} · ${c.location||'—'} · ${c.year||'—'}</small></div><div class="listing-actions"><button class="btn primary" data-approve="${c.id}">Approve</button><button class="btn danger" data-reject="${c.id}">Reject</button></div></div>`).join('')||'<p>No listings waiting for review.</p>';
 openModal(`<span class="eyebrow">ADMIN REVIEW</span><h2>Pending Listings</h2><p>Approve a listing to publish it on the marketplace, or reject it for correction.</p><div>${rows}</div>`);
 $$('[data-approve]').forEach(b=>b.onclick=async()=>{b.disabled=true;const {error}=await supabaseClient.rpc('admin_approve_car',{p_car_id:b.dataset.approve});if(error)toast(error.message);else{toast('Listing approved');await loadAdminReview();await loadCars();}});
 $$('[data-reject]').forEach(b=>b.onclick=async()=>{b.disabled=true;const {error}=await supabaseClient.rpc('admin_reject_car',{p_car_id:b.dataset.reject});if(error)toast(error.message);else{toast('Listing rejected');await loadAdminReview();}});
}

async function updateAuthUI(){
 if(!supabaseClient)return;
 const btn=$('#loginBtn');
 const {data}=await supabaseClient.auth.getSession();
 authUser=data?.session?.user||null;
 if(authUser){
   btn.textContent='My Account';
   btn.onclick=()=>openAccount();
   await loadProfile();
   await loadFavourites();
 }else{
   profile=null;
   btn.textContent='Login';
   btn.onclick=()=>authModal('login');
   await loadFavourites();
 }
}
if(supabaseClient){
 supabaseClient.auth.onAuthStateChange((event,session)=>{
   authUser=session?.user||null;
   if(event==='SIGNED_OUT'){
     profile=null;
     const btn=$('#loginBtn');
     if(btn){btn.textContent='Login';btn.onclick=()=>authModal('login');}
   }else if(event==='SIGNED_IN' || event==='INITIAL_SESSION'){
     setTimeout(()=>updateAuthUI(),50);
   }
 });
}
$('#searchBtn').onclick=applyFilters;$('#sortSelect').onchange=()=>{sortCars();renderCars()};$('#clearBtn').onclick=()=>{$('#searchInput').value='';$('#makeFilter').value='';$('#conditionFilter').value='';$('#locationFilter').value='';applyFilters()};$$('[data-filter]').forEach(a=>a.onclick=()=>{setTimeout(()=>{$('#conditionFilter').value=a.dataset.filter;applyFilters()},0)});$$('[data-cat]').forEach(b=>b.onclick=()=>{const cat=b.dataset.cat;current=CARS.filter(c=>c.body===cat);renderCars();location.hash='cars'});$('#sellBtn').onclick=openSell;$('#modalClose').onclick=closeModal;$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};$('#contactForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await supabaseClient.from('enquiries').insert({customer_id:authUser?.id||null,customer_name:String(f.get('name')||''),customer_phone:String(f.get('phone')||''),customer_email:String(f.get('email')||authUser?.email||''),message:String(f.get('message')||''),channel:'website',status:'new'});if(error)toast(error.message);else{e.target.reset();toast('Enquiry sent successfully')}};$('#menuBtn').onclick=()=>$('#mainNav').classList.toggle('open');
navCounts();renderCars();renderFavs();renderCompare();monthly();loadCars();updateAuthUI();['loanPrice','loanDeposit','loanYears','loanRate'].forEach(id=>$('#'+id).oninput=monthly);

async function loadDealerDashboard(){
  openModal('<span class="eyebrow">DEALER DASHBOARD</span><h2>Loading Dealer Dashboard…</h2><p class="muted">Checking your admin account and dealer information.</p>');
  const {data:sessionData}=await supabaseClient.auth.getSession();
  authUser=sessionData?.session?.user||authUser;
  if(!authUser){authModal('login');return}
  const {data:adminProfile,error:profileError}=await supabaseClient.from('profiles').select('id,full_name,phone,role').eq('id',authUser.id).maybeSingle();
  if(profileError){toast(profileError.message||'Could not load account permissions');return}
  profile=adminProfile||profile;
  if(profile?.role!=='admin'){toast('Dealer Dashboard is restricted to admin only.');return}

  const {data:dealer,error:dealerError}=await supabaseClient.from('dealers').select('*').eq('owner_id',authUser.id).maybeSingle();
  if(dealerError){toast(dealerError.message);return}

  const dealerForm=(existing={})=>`<span class="eyebrow">DEALER PROFILE</span><h2>${existing.id?'Manage':'Create'} Dealer Profile</h2>
  <p class="muted">Complete your official dealer information. Your profile can be shown to customers while verification remains controlled by GER Cars Tanzania.</p>
  <form id="dealerForm" class="contact-form" autocomplete="off">
    <div class="form-row"><input name="business_name" required placeholder="Registered business / dealer name" value="${existing.business_name||''}"><input name="phone" required placeholder="Business phone" value="${existing.phone||profile?.phone||''}"></div>
    <div class="form-row"><input name="whatsapp" placeholder="WhatsApp number" value="${existing.whatsapp||profile?.phone||''}"><input name="email" type="email" required placeholder="Business email" value="${existing.email||authUser.email||''}"></div>
    <input name="location" required placeholder="Full business location / showroom address" value="${existing.location||''}">
    <textarea name="description" required placeholder="Business description, brands/services, opening information, and customer service details">${existing.description||''}</textarea>
    <label class="file-label">Dealer logo <input id="dealerLogoInput" name="logo" type="file" accept="image/png,image/jpeg,image/webp"></label>
    <small class="muted">Use a clear PNG/JPG/WebP logo. Maximum 5 MB.</small>
    ${existing.logo_url?'<div class="dealer-logo-current"><img class="dealer-logo-preview" src="'+existing.logo_url+'" alt="Current dealer logo"><label><input name="remove_logo" type="checkbox"> Remove current logo</label></div>':''}
    <div id="dealerLogoPreview" class="photo-upload-preview"></div>
    <button class="btn primary" type="submit">${existing.id?'Save Dealer Information':'Create Dealer Profile'}</button>
  </form>`;

  if(!dealer){
    openModal(dealerForm());
    bindDealerLogoPreview();
    $('#dealerForm').onsubmit=async e=>{
      e.preventDefault();await saveDealerProfile(e.target,null);
    };
    return;
  }

  const {data:cars=[],error:carsError}=await supabaseClient.from('cars').select('id,listing_id,make,model,year,price,status,location,created_at,dealer_id,seller_id').or(`dealer_id.eq.${dealer.id},seller_id.eq.${authUser.id}`).order('created_at',{ascending:false});
  if(carsError){toast(carsError.message);return}
  const ids=cars.map(c=>c.id);
  let leads=[];
  if(ids.length){const r=await supabaseClient.from('enquiries').select('id,car_id,customer_name,status,created_at').in('car_id',ids).order('created_at',{ascending:false});if(!r.error)leads=r.data||[]}
  const {data:stats,error:statsError}=await supabaseClient.rpc('dealer_dashboard_stats');
  if(statsError){toast(statsError.message);return}
  const active=Number(stats?.active_listings||0),sold=Number(stats?.sold_listings||0),pending=Number(stats?.pending_listings||0);
  const list=cars.length?cars.slice(0,20).map(c=>`<div class="my-listing-row"><div><b>${c.make} ${c.model}</b><br><small>${c.listing_id||'No Listing ID'} · ${money(c.price)} · ${c.location||'—'} · <strong>${c.status}</strong></small></div><div class="listing-actions">${c.status==='active'?'<button class="btn ghost" data-sold="'+c.id+'">Mark Sold</button>':''}${c.status==='sold'?'<button class="btn danger" data-delete-sold="'+c.id+'">Delete Sold Car</button>':''}</div></div>`).join(''):'<p>No dealer listings yet.</p>';
  const leadRows=leads.length?leads.slice(0,10).map(e=>`<div style="padding:10px 0;border-bottom:1px solid #ddd"><b>${e.customer_name||'Customer'}</b><br><small>${e.status||'new'} · ${new Date(e.created_at).toLocaleString()}</small></div>`).join(''):'<p>No leads yet.</p>';
  openModal(`<span class="eyebrow">DEALER DASHBOARD</span><div class="dealer-heading">${dealer.logo_url?'<img src="'+dealer.logo_url+'" alt="Dealer logo">':''}<div><h2>${dealer.business_name||'Dealer'}</h2><p>${dealer.location||''} ${dealer.verified?'· ✓ Verified':''}</p></div></div>
  <div class="stats"><div><strong>${active}</strong><small>Active Listings</small></div><div><strong>${leads.length}</strong><small>Leads</small></div><div><strong>${sold}</strong><small>Sold</small></div></div>
  <p class="muted">Pending review: ${pending} · Total listings: ${cars.length}</p>
  <div class="listing-actions"><button id="editDealerBtn" class="btn primary">Edit Dealer Information</button></div><hr><h3>My Dealer Listings</h3><div>${list}</div><hr><h3>Recent Leads</h3><div>${leadRows}</div>`);
  $('#editDealerBtn').onclick=()=>{openModal(dealerForm(dealer));bindDealerLogoPreview();$('#dealerForm').onsubmit=async e=>saveDealerProfile(e.target,dealer)};
  $$('[data-sold]').forEach(b=>b.onclick=()=>markSold(b.dataset.sold));
  $$('[data-delete-sold]').forEach(b=>b.onclick=()=>deleteSoldCar(b.dataset.deleteSold));
  const a=$('#dealerActiveCount'),l=$('#dealerLeadCount'),s=$('#dealerSoldCount'),preview=$('#dealerPreviewList');
  if(a)a.textContent=active;if(l)l.textContent=leads.length;if(s)s.textContent=sold;
  if(preview)preview.innerHTML=cars.length?cars.slice(0,3).map(c=>`<span>🚙 ${c.make} ${c.model} <b>${money(c.price)}</b></span>`).join(''):'<span>No dealer listings yet.</span>';
}

function bindDealerLogoPreview(){
  const input=$('#dealerLogoInput'),preview=$('#dealerLogoPreview');
  if(!input||!preview)return;
  input.onchange=()=>{
    preview.innerHTML='';
    const file=input.files?.[0];
    if(!file)return;
    if(!file.type.startsWith('image/')){toast('Only image files are allowed.');input.value='';return}
    if(file.size>5*1024*1024){toast('Dealer logo must be 5 MB or smaller.');input.value='';return}
    const box=document.createElement('div');box.className='photo-upload-item';
    const img=document.createElement('img');img.alt='New dealer logo preview';img.src=URL.createObjectURL(file);box.appendChild(img);
    const n=document.createElement('span');n.textContent='New';box.appendChild(n);
    preview.appendChild(box);
  };
}
function dealerStoragePathFromUrl(url){
  if(!url)return null;
  const marker='/storage/v1/object/public/dealer-assets/';
  const i=url.indexOf(marker);
  return i>=0?decodeURIComponent(url.slice(i+marker.length)):null;
}

async function saveDealerProfile(form,existing){
  const f=new FormData(form),btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Saving…';
  try{
    const oldLogoUrl=existing?.logo_url||null;
    const removeLogo=f.get('remove_logo')==='on';
    let logoUrl=removeLogo?null:oldLogoUrl;
    const logo=f.get('logo');
    if(logo instanceof File && logo.size){
      if(!logo.type.startsWith('image/'))throw new Error('Only image files are allowed.');
      if(logo.size>5*1024*1024)throw new Error('Dealer logo must be 5 MB or smaller.');
      const path=`${authUser.id}/logo-${Date.now()}-${logo.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-')}`;
      const up=await supabaseClient.storage.from('dealer-assets').upload(path,logo,{upsert:false,contentType:logo.type});
      if(up.error)throw up.error;
      logoUrl=supabaseClient.storage.from('dealer-assets').getPublicUrl(path).data.publicUrl;
    }
    const payload={p_business_name:String(f.get('business_name')||''),p_phone:String(f.get('phone')||''),p_whatsapp:String(f.get('whatsapp')||''),p_email:String(f.get('email')||''),p_location:String(f.get('location')||''),p_description:String(f.get('description')||''),p_logo_url:logoUrl};
    const {error}=await supabaseClient.rpc('upsert_my_dealer_profile',payload);
    if(error)throw error;
    if(oldLogoUrl && (removeLogo || (logo instanceof File && logo.size))){
      const oldPath=dealerStoragePathFromUrl(oldLogoUrl);
      if(oldPath){
        const removed=await supabaseClient.storage.from('dealer-assets').remove([oldPath]);
        if(removed.error)console.warn('Old dealer logo cleanup failed:',removed.error.message);
      }
    }
    const {data:dealerRow}=await supabaseClient.from('dealers').select('id').eq('owner_id',authUser.id).maybeSingle();
    if(dealerRow?.id)await supabaseClient.from('cars').update({dealer_id:dealerRow.id}).eq('seller_id',authUser.id);
    toast(removeLogo?'Dealer logo removed and information saved':(logo instanceof File && logo.size?'Dealer logo replaced and information saved':'Dealer information saved'));
    await loadDealerDashboard();
  }catch(err){toast(err.message||'Could not save dealer profile')}finally{btn.disabled=false;btn.textContent=existing?'Save Dealer Information':'Create Dealer Profile'}
}

document.addEventListener('click',e=>{
  const b=e.target.closest('#dealerDashboardBtn');
  if(b){e.preventDefault();loadDealerDashboard();}
});



