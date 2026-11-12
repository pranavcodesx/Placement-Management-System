export interface Skill{n:string;c:'tech'|'lang'|'fw'|'soft'}
export interface Project{id?:number;n:string;ds:string;tk:string;lk:string;demo:string;st:'Published'|'Draft';thumb:string}
export interface Cert{id?:number;n:string;o:string;y:string;idat:string;cid:string;vl:string;file:string;fn:string;img:string}
export interface CareerResource{id:number;t:string;ds:string;cat:string;ty:string;tags:string[];file:string;fn:string;url:string;st:'Published'|'Draft';dl:number;up:string}
export interface Pref{roles:string[];locs:string[];types:string[];sal:number;cats:string[]}
export interface Sections{personal:boolean;education:boolean;skills:boolean;projects:boolean;resume:boolean;prefs:boolean}
export interface Student{id:number;n:string;e:string;ph:string;s:string;photo:string;dob:string;gn:string;loc:string;ad:string;col:string;deg:string;d:string;yr:string;py:number|'';p10:number;p12:number;sty:'CGPA'|'Percentage';sc:number;pct:number;bk:number;b:string;skills:Skill[];sk:string[];pr:Project[];ce:Cert[];rs:string;rsu:string;rsd:string;pref:Pref;step:number;ob:boolean;sec:Sections;pp:number;jn?:string}
export interface Job{id:number;t:string;c:number;l:string;ty:string;pk:string;cat:string;ds:string;dl:string;min:number;m10:number;m12:number;mb:number;d:string[];sk:string[];sd:string;ivd:string;ex:string;ql:string;bn:string[];hl:string;cr:string}
export interface Company{id:number;n:string;w:string;p:string;s:string;tg:string;ab:string;em:string;ct:string;lg:string}
export interface HistoryItem{st:string;dt:string}
export interface Application{id:number;s:number;j:number;st:string;dt:string;h:HistoryItem[]}
export interface Note{id:number;t:string;tm:number;rd:number}
export interface Interview{id:number;a:number;at:number;r:string;md:string;lc:string}
export interface Policy{one:number;dream:number}
export interface DB{st:Student[];jobs:Job[];cos:Company[];apps:Application[];nt:Note[];na:Note[];iv:Interview[];sv:number[];pl:number;pol:Policy;resources:CareerResource[];admin:{n:string;e?:string;org?:string;ph?:string;photo?:string}}
export interface AppConfig{role:string;home?:string;guard?:()=>boolean|void;nav:string[][];al?:Record<string,string>;views:Record<string,(arg?:string)=>string>;to:string;sp:string;sv:string;pf:string;user:()=>{n:string;photo?:string};unread:()=>number}
declare global{var Chart:any;interface Window{CT_API?:string;WZ?:any;Chart?:any}}

export {};
