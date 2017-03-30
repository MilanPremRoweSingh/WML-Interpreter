 regHolder = {TSTART : /^{{/, //(?!({))|^{{(?=({:))/, 
 TEND : /^}}/,
 PIPE : /^\|/,
 DSTART : /^{:/,
 DEND : /^:}/,
 PSTART : /^{{3}/,
 PEND : /^}{3}/,
 OUTERTEXT : /^((?!{{|{:)[^\s]|[^\S])*/,
 INNERTEXT : /^((?!{{|{:|{{{|}}|\|)[^\s]|[^\S])*/,
 INNERDTEXT :/^((?!{{|{:|{{{|\||:})[^\s]|[^\S])*/,
 PNAME : /(^((?!\||}{3}).)*)/}
 

var AST = {};
var scanned = '';
var head = AST;
function scan(s, tokenset){ //
	for (token in tokenset){
		if (tokenset[token]== true){
			if (s.match(regHolder[token])){
				if (regHolder[token].exec(s)[0]!=""){
					retObj = {'token':token,'tokenvalue':regHolder[token].exec(s)[0]}
					return retObj;
				}
			}
				
		}
	} 
	return 0;
}

function scanit(s){ //Given a string of WML, parses it and creates an AST
	var sout = "";
	while(s){
		var t = scan(s,TOKENSET);
		sout += t.tokenvalue;
		s = s.substr(t.tokenvalue.length);
	}
	return sout;
}



function input(s,tokenset){
	t = scan(s,tokenset);
	s = s.substr(t.tokenvalue.length);
	
	return [s,t];
}


function parseOuter(s){
	while(s!==""){
		inp = input(s,{'OUTERTEXT':true,'DSTART':true,'TSTART':true});
		scanToken = inp[1].tokenvalue;
		s=inp[0];
		scanned=inp[0];
		switch (inp[1].token){
			case 'OUTERTEXT':
	 			temp = {};
	 			temp.name = "outer";
	 			temp.OUTERTEXT = scanToken;
	 			temp.templateinvocation = null;
	 			temp.templatedef = null;
	 			temp.next = null;
	 			AST.next = temp;
	 			AST = temp;
		 		break;	

		 	case 'TSTART':
	 			temp = {};
	 			temp.name = "outer";
	 			temp.OUTERTEXT = null;
	 			temp.templatedef = null;
	 			temp.next = null;
	 			AST.next = temp;
	 			AST = temp;

	 			temp2 = {};
	 			temp2.name = "templateinvocation";
	 			temp2.targs = null;
	 			temp.templateinvocation = temp2;
	 			parseTemplateInvocation(s,temp2);
	 			s = scanned;

		 		break;

		 	case 'DSTART':
		 		temp = {};
	 			temp.name = "outer";
	 			temp.OUTERTEXT = null;
	 			temp.templateinvocation = null;
	 			temp.next = null;
	 			AST.next = temp;
	 			AST = temp;

	 			temp2 = {};
	 			temp2.name = "templatedef";
	 			temp.templatedef = temp2;
	 			parseTemplateDef(s,temp2);
	 			s = scanned;

		 		break;	

		 	case null:
		 		return "Finished"
		 		break;
		}
	}
	return head;
}


function parseTemplateInvocation(s){
	var tsHead = arguments[1];
	var tsAST = tsHead;
	var tsArgs;
	argsDef = false;
	while(s!==""){
		
		inp = input(s,{'INNERTEXT':true, 'DSTART':true, 'PSTART':true ,'TSTART':true,'TEND':true, 'PIPE':true});
		scanToken = inp[1].tokenvalue;
		s=inp[0];
		scanned = inp[0];
	  	switch (inp[1].token){
		 	case 'INNERTEXT':
		 		temp = {};
	 			temp.name = "itext";
	 			temp.INNERTEXT = scanToken;
	 			temp.templateinvocation = null;
	 			temp.templatedef = null;
	 			temp.tparam = null;
	 			temp.itext = null;
	 			tsAST.itext = temp;
	 			tsAST = temp;
		 		break;

		 	case 'TSTART':
		 		temp = {};
	 			temp.name = "itext";
	 			temp.INNERTEXT = null;
	 			temp.templatedef = null;
	 			temp.tparam = null;
	 			temp.itext = null;
	 			tsAST.itext = temp;
	 			tsAST = temp;

	 			temp2 = {};
	 			temp2.name = "templateinvocation";
	 			temp2.targs = null;
	 			temp.templateinvocation = temp2;
	 			parseTemplateInvocation(s,temp2);
	 			s = scanned;
		 		break;

		 	case 'DSTART':
		 		temp = {};
	 			temp.name = "itext";
	 			temp.INNERTEXT = null;
	 			temp.templateinvocation = null;
	 			temp.tparam = null;
	 			temp.itext = null;
	 			tsAST.itext = temp;
	 			tsAST = temp;

	 			temp2 = {};
	 			temp2.name = "templatedef";
	 			temp2.dtext = null;
	 			temp2.next = null;
	 			temp.templatedef = temp2;
	 			parseTemplateDef(s,temp2);
	 			s = scanned;
		 		break;

		 	case 'PSTART' :
		 		temp = {};
	 			temp.name = "itext";
	 			temp.INNERTEXT = null;
	 			temp.templateinvocation = null;
	 			temp.templatedef = null;
	 			temp.itext = null;
	 			tsAST.itext = temp;
	 			tsAST = temp;

	 			temp2 = {};
	 			temp2.name = "tparam";
	 			temp.tparam = temp2;
	 			parseTParams(s,temp2);
	 			s = scanned;
		 		break;

		 	case 'PIPE' :
		 		if (argsDef == false){
		 			temp = {};
		 			temp.name = 'targs';
		 			temp.itext = null;
		 			temp.next = null;
		 			tsHead.targs = temp;
		 			tsArgs = temp;
		 			argsDef = true;
		 			tsAST = temp;
		 		} else {
		 			temp = {};
		 			temp.name = 'targs';
		 			temp.itext = null;
		 			temp.next = null;
		 			tsArgs.next = temp;
		 			tsArgs = temp;
		 			tsAST = temp;
		 		}
		 		break;

		 	case 'TEND':
		 		return tsHead;
		 		break;
	 	}
	}
}

function parseTemplateDef(s){
	var tdHead = arguments[1];
	var tdAST = tdHead;
	var nHead;
	nTestTrue = false;
	while(s!==""){
		
		inp = input(s,{'INNERDTEXT':true,'PSTART':true,'TSTART':true,'DSTART':true,  "PIPE":true, "DEND":true});
	  	scanToken = inp[1].tokenvalue;
		s=inp[0];
		scanned = inp[0];

	  	switch (inp[1].token){
		 	case 'INNERDTEXT':
		 		temp = {};
	 			temp.name = "dtext";
	 			temp.INNERDTEXT = scanToken;
	 			temp.templateinvocation = null;
	 			temp.templatedef = null;
	 			temp.dtext = null;
	 			temp.tparam = null;
	 			tdAST.dtext = temp;
	 			tdAST = temp;
		 		break;

		 	case 'TSTART':
		 		temp = {};
	 			temp.name = "dtext";
	 			temp.INNERDTEXT = null;
	 			temp.templatedef = null;
	 			temp.tparam = null;
	 			temp.dtext = null;
	 			tdAST.dtext = temp;
	 			tdAST = temp;

	 			temp2 = {};
	 			temp2.name = "templateinvocation";
	 			temp2.targs = null;
	 			temp.templateinvocation = temp2;
	 			parseTemplateInvocation(s,temp2);
	 			s = scanned;
		 		break;

		 	case 'DSTART':
		 		temp = {};
	 			temp.name = "dtext";
	 			temp.INNERTEXT = null;
	 			temp.templateinvocation = null;
	 			temp.tparam = null;
	 			temp.dtext = null;
	 			tdAST.dtext = temp;
	 			tdAST = temp;

	 			temp2 = {};
	 			temp2.name = "templatedef";
	 			temp2.dtext = null;
	 			temp2.next = null;
	 			temp.templatedef = temp2;
	 			parseTemplateDef(s,temp2);
	 			s = scanned;
		 		break;
		 		break;

		 	case 'PSTART' :
		 		temp = {};
	 			temp.name = "dtext";
	 			temp.INNERDTEXT = null;
	 			temp.templateinvocation = null;
	 			temp.templatedef = null;
	 			temp.dtext = null;
	 			tdAST.dtext = temp;
	 			tdAST = temp;

	 			temp2 = {};
	 			temp2.name = "tparam";
	 			temp.tparam = temp2;
	 			parseTParams(s,temp2);
	 			s = scanned;
		 		break;	

		 	case 'PIPE' :
		 		if (nTestTrue == false){
		 			temp = {};
		 			temp.name = 'dtextN';
		 			temp.dtext = null;
		 			temp.next = null;
		 			tdHead.next = temp;
		 			nHead = temp;
		 			nTestTrue = true;
		 			tdAST = temp;
		 		} else {
		 			temp = {};
		 			temp.name = 'dtextN';
		 			temp.dtext = null;
		 			temp.next = null;
		 			nHead.next = temp;
		 			tdAST = temp;
		 		}
		 		break;	

		 	case 'DEND' :
		 		return tdHead;
		 		break;
		 }
 
	}
}
 	

function parseTParams(s){
	var tpAST = arguments[1];
	tpHead = tpAST;
	while(s!=""){
		inp = input(s,{'PNAME':true,'PEND':true, 'PIPE':true});
		s = inp[0];
		scanned = inp[0];
		scanToken = inp[1].tokenvalue;
  		switch (inp[1].token){
	 		case 'PNAME':
	 			tpAST.PNAME = scanToken;
	 			break;

	 		case 'PEND':
	 			return tpHead;
	 			break;
		}	
	}
}

// PRINTS THE ABSTRACT SYNTAX TREE
function printAST(a){
	a = a.next;
	format = {"templateinvocation" : ["{{","}}",printTempInv], "templatedef" : ["{:",":}",printTempDef],"tparam" : ["{{{","}}}",printTParam]};
	var retStr = '';
	loop = true;	
	while (a!==null){
		if (a.OUTERTEXT == null){
			for(let prop in a){
				for (oform in format){
					if (prop == oform && a[prop] !== null){
						retStr += format[oform][0];
						retStr += format[oform][2](a[prop]);
					}	
				}
			}
		} else {
			retStr += a.OUTERTEXT;
		}
		a = a.next;
	}
	return retStr;
}

function itext(a){
	rtStr = '';
	format = {"templateinvocation" : ["{{","}}",printTempInv], "templatedef" : ["{:",":}",printTempDef],"tparam" : ["{{{","}}}",printTParam]};
	while (a!==null){
		if (a.INNERTEXT == null){
			for(prop in a){
				for (iform in format){
					if (prop == iform && a[prop] != null && a[prop] !== undefined){
						rtStr += format[iform][0];
						rtStr += format[iform][2](a[prop]);
					}
				}
			}
		} else {
			rtStr += a.INNERTEXT;
		}
		a = a.itext;
	}
	return rtStr;
}

function dtext(a){
	rtStr = '';
	format = {"templateinvocation" : ["{{","}}",printTempInv], "templatedef" : ["{:",":}",printTempDef],"tparam" : ["{{{","}}}",printTParam]};
	while (a!==null){
		if (a.INNERDTEXT == null){
			for(prop in a){
				for (dform in format){
					if (prop == dform && a[prop] != null && a[prop] !== undefined){
						rtStr += format[dform][0];
						rtStr += format[dform][2](a[prop]);
					}
				}
			}
		} else {
			rtStr += a.INNERDTEXT;
		}
		a = a.dtext;
	}
	return rtStr;
}


function printTempInv(a){
	var b = a.targs;
	a = a.itext;
	retStr = itext(a);
	while (b!==null){
		retStr+= "|"+itext(b.itext);
		b = b.next;
	}
	return retStr +"}}"
}

function printTempDef(a){	
 	var b = a.next;
	a = a.dtext;
	retStr = dtext(a);
	while (b!==null){
		retStr+= "|"+dtext(b.dtext);
		b = b.next;
	}
	return retStr +":}"
}


function printTParam(a){
	return a.PNAME+"}}}";
}


