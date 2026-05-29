# Publish Approval Workflow

## Setup

### 1. Create the publish-queue sheet in DA Live

Go to `da.live/sheet#/mritunjayyadaveds/eds-dalive-client/publish-queue`

Add columns: page | requestedBy | requestedAt | reason | status | reviewedBy | reviewedAt

### 2. Author Bookmarklet — "Request Publish"

Create a browser bookmark with this URL (all one line):

```
javascript:void((async()=>{const p=location.pathname.replace('/edit#/mritunjayyadaveds/eds-dalive-client','');const r=prompt('Reason for publishing '+p+' (min 10 chars):');if(!r||r.length<10){alert('Reason must be at least 10 characters');return}const q=await fetch('https://content.da.live/mritunjayyadaveds/eds-dalive-client/publish-queue.json').then(r=>r.json()).catch(()=>({data:[]}));const data=q.data||[];data.push({page:p,requestedBy:'author',requestedAt:new Date().toISOString(),reason:r,status:'pending',reviewedBy:'',reviewedAt:''});const resp=await fetch('https://admin.da.live/source/mritunjayyadaveds/eds-dalive-client/publish-queue.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data})});if(resp.ok)alert('Request submitted!');else alert('Failed: '+resp.status)})())
```

### 3. Admin Bookmarklet — "Approval Dashboard"

Create a browser bookmark with this URL:

```
javascript:void((async()=>{const q=await fetch('https://content.da.live/mritunjayyadaveds/eds-dalive-client/publish-queue.json').then(r=>r.json()).catch(()=>({data:[]}));const data=q.data||[];const pending=data.filter(r=>r.status==='pending');if(!pending.length){alert('No pending requests');return}let msg='PENDING REQUESTS:\n\n';pending.forEach((r,i)=>{msg+=`${i+1}. ${r.page} - by ${r.requestedBy}\n   Reason: ${r.reason}\n\n`});const choice=prompt(msg+'\nEnter number to APPROVE, or type "reject N" to reject:');if(!choice)return;const reject=choice.toLowerCase().startsWith('reject');const num=parseInt(reject?choice.split(' ')[1]:choice)-1;if(isNaN(num)||num<0||num>=pending.length){alert('Invalid choice');return}const idx=data.indexOf(pending[num]);data[idx].status=reject?'rejected':'approved';data[idx].reviewedBy='admin';data[idx].reviewedAt=new Date().toISOString();const resp=await fetch('https://admin.da.live/source/mritunjayyadaveds/eds-dalive-client/publish-queue.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data})});if(resp.ok)alert((reject?'Rejected':'Approved')+': '+pending[num].page);else alert('Failed: '+resp.status)})())
```

## Usage

### For Authors:
1. Open a page in DA Live editor (e.g. `da.live/edit#/mritunjayyadaveds/eds-dalive-client/article`)
2. Click the "Request Publish" bookmarklet
3. Enter reason → request is submitted

### For Admin:
1. Open any page on DA Live (e.g. `da.live/edit#/mritunjayyadaveds/eds-dalive-client/about`)
2. Click the "Approval Dashboard" bookmarklet
3. See pending requests, enter number to approve or "reject N" to reject
