function createEnv(parent){
		var env = {};
		env.name = Math.random();
		env.bindings = {};
		env.parent = parent;
		return env
}

function lookup(name,env){
		for (bind in env.bindings){
			if (bind == name){
				return env.bindings[bind];
			}
		}
		if (env.parent != null & env.parent !== undefined){
			return lookup(name,env.parent);
		}
		return null;
}

function evalWML(ast,env){
	var node = ast;
	var retArr= [];
	var retStr='';
	var i = 0;
	while (node != null){
		if (node.OUTERTEXT != null & node.OUTERTEXT !== undefined){
			retArr[i]=node.OUTERTEXT;
			node = node.next;
		} else if (node.templateinvocation!=null & node.templateinvocation!==undefined){
			retArr[i]=node.templateinvocation
			node = node.next	
		} else if (node.templatedef!=null & node.templatedef!==undefined){
			retArr[i]=evalTD(node.templatedef,env)
			node = node.next
		}
		i++;
	}
	for (var j = 0;j<i;j++){
		if (typeof retArr[j] == "string"){
			retStr += retArr[j];
		} else {
			retStr += evalTI(retArr[j],env);
		}
	}
	return retStr;
}

function evalTI(ast,env){
	var node = ast;
	var i = 0;
	var tempName =  evalIText(node.itext,env);
	if (tempName=="#if"|tempName=="#ifeq"|tempName=="#expr"){
		return evalSpecial(node.targs,env,tempName)
	}

	var targs = [];//executing environment
	var def = lookup(tempName,env);//definition of this template

	var sub = tempName.substring(0,7)
	if (sub=='{"envs"'&&def==null){ //Stringified code always starts with '{"envs' and if that isnt some other temp def name then unstrinigy it
		def = unstringify(tempName);
	}
	var node = node.targs
	while (node != null){
		if (node.itext != null & node.itext !== undefined){
			targs[i]=evalIText(node.itext,env);
			node = node.next;
		} 
		i++;
	}
	
	var exeEnv = createEnv(def.env)
	for (j=0;j<=i;j++){
		exeEnv.bindings[def.params[j]] = targs[j];
	}

	return evalDText(def.body.dtext, exeEnv)
}
function evalTD(ast,env){
	var node = ast;
	var dparams = [];
	var i = 0;
	var tempName = evalDText(node.dtext);
	var retStr = '';
	var closure;
	var node = node.dparams;

	while (node.next != null){ //Stops when next node is null therefore when node is the body
		dparams[i]=evalDText(node.dtext,env);
		node = node.next; 
		i++;
	}

	closure={'params':dparams,'body':node,'env':env};
	if (tempName.charAt(0)=='`'){
		if (tempName!='`'){
			tempName = tempName.substring(1);
		}
		retStr = stringify(closure);
	}  else {
		env.bindings[tempName]={'params':dparams,'body':node,'env':env};
	}


	return retStr;
}
function evalParam(ast,env){
	return lookup(ast.pname,env);
}

function evalDText(ast,env){
	var retStr = '';
	var retArr= [];
	var i = 0;
	var node = ast;
	while (node!=null & node !== undefined){
		if (node.INNERDTEXT != null & node.INNERDTEXT !== undefined){
			retArr[i]=node.INNERDTEXT;
		} else if (node.templateinvocation!=null & node.templateinvocation!==undefined){
			retArr[i]=node.templateinvocation;
		} else if (node.templatedef!=null & node.templatedef!==undefined){
			retArr[i]=evalTD(node.templatedef,env)
		} else if (node.tparam!=null & node.tparam!==undefined){
			var tpar = lookup(node.tparam.pname,env);
			if (tpar == null){
				retArr[i] = "{{{"+node.tparam.pname+"}}}";
			} else {
				retArr[i] = tpar;
			}
		}
		i++;
		node = node.next
	}

	for (var j = 0;j<i;j++){
		if (typeof retArr[j] == "string"){
			retStr += retArr[j];
		} else {
			retStr += evalTI(retArr[j],env);
		}
	}
	return retStr;
}

function evalIText(ast,env){
	var retStr = '';
	var retArr= [];
	var i =0;
	var node = ast;
	while (node!=null & node !== undefined){
		if (node.INNERTEXT != null & node.INNERTEXT !== undefined){
			retArr[i] = node.INNERTEXT;
		} else if (node.templateinvocation!=null & node.templateinvocation!==undefined){
			retArr[i] =node.templateinvocation
		} else if (node.templatedef!=null & node.templatedef!==undefined){
			retArr[i] =evalTD(node.templatedef,env)
		} else if (node.tparam!=null & node.tparam!==undefined){
			var tpar = lookup(node.tparam.pname,env);
			if (tpar == null){
				retArr[i] = "{{{"+node.tparam.pname+"}}}";
			} else {
				retArr[i] = tpar;
			}
		}
		i++
		node = node.next
	}

	for (var j = 0;j<i;j++){
		if (typeof retArr[j] == "string"){
			retStr += retArr[j];
		} else {
			retStr += evalTI(retArr[j],env);
		}
	}
	return retStr;
}
console.log(evalWML(AST,createEnv(null)));

function evalSpecial(ast,env,tempName){
	var node = ast;
	var condition, ifThen, ifElse;
	switch (tempName){
		case "#if": //{{#if|condition|then|else}}
			condition = evalIText(node.itext,env);
			node = node.next;
			if (node == null){
				return "ERROR INVALID #if"
			}

			if (condition.length > 0){
				var ifThen = evalIText(node.itext,env);
				return ifThen;
			} else {
				node = node.next;
				if (node == null){
					return "ERROR INVALID #if"
				}
				ifElse = evalIText(node.itext,env);
				return ifElse;
			}
			break;

		case "#ifeq": //{{#ifeq|arg1|arg2|then|else}}
			var arg1 = evalIText(node.itext,env);
			node = node.next;
			if (node == null){
				return "ERROR INVALID #if"
			}
			var arg2 = evalIText(node.itext,env);
			node = node.next;
			if (node == null){
				return "ERROR INVALID #if"
			}
			if (arg1==arg2){
				var ifThen = evalIText(node.itext,env);
				return ifThen;
			} else {
				node = node.next;
				if (node == null){
				return "ERROR INVALID #if"
				}
				var ifElse = evalIText(node.itext,env);
				return ifElse;
			}
			break;

		case "#expr": //{{#eval|some JS expr}}
			return eval(evalIText(node.itext,env))
			break;
	}
}


//NOT MY WORK STARTING HERE

// Convert a closure (template binding) into a serialized string.
// This is assumed to be an object with fields params, body, env.
function stringify(b) {
    // We'll need to keep track of all environments seen.  This
    // variable maps environment names to environments.
    var envs = {};
    // A function to gather all environments referenced.
    // to convert environment references into references to their
    // names.
    function collectEnvs(env) {
        // Record the env, unless we've already done so.
        if (envs[env.name])
            return;
        envs[env.name] = env;
        // Now go through the bindings and look for more env references.
        for (var b in env.bindings) {
            var c = env.bindings[b];
            if (c!==null && typeof(c)==="object") {
                if ("env" in c) {
                    collectEnvs(c.env);
                }
            }
        }
        if (env.parent!==null)
            collectEnvs(env.parent);
    }
    // Ok, first step gather all the environments.
    collectEnvs(b.env);
    // This is the actual structure we will serialize.
    var thunk = { envs:envs ,
                  binding:b
                };
    // And serialize it.  Here we use a feature of JSON.stringify, which lets us
    // examine the current key:value pair being serialized, and override the
    // value.  We do this to convert environment references to environment names,
    // in order to avoid circular references, which JSON.stringify cannot handle.
    var s = JSON.stringify(thunk,function(key,value) {
        if ((key=='env' || key=='parent') && typeof(value)==='object' && value!==null && ("name" in value)) {
            return value.name;
        }
        return value;
    });
    return s;
}

// Convert a serialized closure back into an appropriate structure.
function unstringify(s) {
    var envs;
    // A function to convert environment names back to objects (well, pointers).
    function restoreEnvs(env) {
        // Indicate that we're already restoring this environmnet.
        env.unrestored = false;
        // Fixup parent pointer.
        if (env.parent!==null && typeof(env.parent)==='number') {
            env.parent = envs[env.parent];
            // And if parent is unrestored, recursively restore it.
            if (env.parent.unrestored)
                restoreEnvs(env.parent);
        }
        // Now, go through all the bindings.
        for (var b in env.bindings) {
            var c = env.bindings[b];
            // If we have a template binding, with an unrestored env field
            if (c!==null && typeof(c)==='object' && c.env!==null && typeof(c.env)==='number') {
                // Restore the env pointer.
                c.env = envs[c.env];
                // And if that env is not restored, fix it too.
                if (c.env.unrestored)
                    restoreEnvs(c.env);
            }
        }
    }
    var thunk;
    try {
        thunk = JSON.parse(s);
        // Some validation that it is a thunk, and not random text.
        if (typeof(thunk)!=='object' ||
            !("binding" in thunk) ||
            !("envs" in thunk))
            return null;

        // Pull out our set of environments.
        envs = thunk.envs;
        // Mark them all as unrestored.
        for (var e in envs) {
            envs[e].unrestored = true;
        }
        // Now, recursively, fixup env pointers, starting from
        // the binding env.
        thunk.binding.env = envs[thunk.binding.env];
        restoreEnvs(thunk.binding.env);
        // And return the binding that started it all.
        return thunk.binding;
    } catch(e) {
        // A failure in unparsing it somehow.
        return null;
    }
}


//MY WORK AFTER THIS POINT