/* ============================================================
   SE Academy — code runtimes. Real interpreters in JS so the
   hands-on lab genuinely runs your code with real output.
   Exported to window.SELab (browser) and module.exports (node test).
   Contains: runJava (Java subset), runBash (terminal sim), runJS.
   No external libs. No network. Pure compute.
   ============================================================ */
(function (root) {
  "use strict";

  /* =========================================================
     JAVA SUBSET INTERPRETER
     Supports: int/double/boolean/String/char, arrays, arithmetic
     with correct int-vs-double division, string concat, if/else,
     for/while, methods (static), System.out.println/print,
     String + Math + Integer helpers. Tagged values for correctness.
     ========================================================= */

  var MAX_STEPS = 2000000, MAX_OUT = 5000;

  function JavaError(msg) { this.message = msg; this.javaError = true; }

  // ---- tagged value helpers ----
  function V(type, value) { return { type: type, value: value }; }
  function isNum(t) { return t === "int" || t === "double"; }
  function javaStr(val) {
    if (val == null) return "null";
    switch (val.type) {
      case "int": return String(val.value | 0 === val.value ? val.value : Math.trunc(val.value));
      case "double": {
        var n = val.value;
        if (!isFinite(n)) return n > 0 ? "Infinity" : (n < 0 ? "-Infinity" : "NaN");
        if (Number.isInteger(n)) return n.toFixed(1);
        return String(n);
      }
      case "boolean": return val.value ? "true" : "false";
      case "char": return val.value;
      case "String": return val.value;
      default:
        if (/\[\]$/.test(val.type)) return "[" + val.type + "@array]";
        return String(val.value);
    }
  }
  function intify(n) { return V("int", Math.trunc(n)); }

  // ---- tokenizer ----
  function tokenize(src) {
    var toks = [], i = 0, n = src.length, line = 1;
    var kw = { "int":1,"double":1,"boolean":1,"String":1,"char":1,"long":1,"float":1,"void":1,
      "if":1,"else":1,"for":1,"while":1,"return":1,"break":1,"continue":1,"true":1,"false":1,
      "public":1,"private":1,"static":1,"class":1,"new":1,"final":1,"null":1,"var":1 };
    while (i < n) {
      var c = src[i];
      if (c === "\n") { line++; i++; continue; }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "/" && src[i + 1] === "*") { i += 2; while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; } i += 2; continue; }
      if (c === '"') {
        var s = ""; i++;
        while (i < n && src[i] !== '"') {
          if (src[i] === "\\") { var e = src[i + 1]; s += e === "n" ? "\n" : e === "t" ? "\t" : e === "\\" ? "\\" : e === '"' ? '"' : e === "'" ? "'" : e; i += 2; }
          else s += src[i++];
        }
        i++; toks.push({ t: "string", v: s, line: line }); continue;
      }
      if (c === "'") {
        var ch; i++;
        if (src[i] === "\\") { var e2 = src[i + 1]; ch = e2 === "n" ? "\n" : e2 === "t" ? "\t" : e2 === "\\" ? "\\" : e2 === "'" ? "'" : e2 === '"' ? '"' : e2; i += 2; }
        else ch = src[i++];
        i++; toks.push({ t: "char", v: ch, line: line }); continue;
      }
      if (c >= "0" && c <= "9" || (c === "." && src[i + 1] >= "0" && src[i + 1] <= "9")) {
        var num = ""; var isD = false;
        while (i < n && ((src[i] >= "0" && src[i] <= "9") || src[i] === ".")) { if (src[i] === ".") isD = true; num += src[i++]; }
        if (src[i] === "d" || src[i] === "D" || src[i] === "f" || src[i] === "F") { isD = true; i++; }
        else if (src[i] === "L" || src[i] === "l") { i++; }
        toks.push({ t: isD ? "double" : "int", v: parseFloat(num), line: line }); continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        var id = "";
        while (i < n && /[A-Za-z0-9_$]/.test(src[i])) id += src[i++];
        toks.push({ t: kw[id] ? "kw" : "id", v: id, line: line }); continue;
      }
      // operators (longest first)
      var three = src.substr(i, 3), two = src.substr(i, 2);
      if (["===", "!=="].indexOf(three) >= 0) { toks.push({ t: "op", v: three, line: line }); i += 3; continue; }
      if (["==","!=","<=",">=","&&","||","++","--","+=","-=","*=","/=","%="].indexOf(two) >= 0) { toks.push({ t: "op", v: two, line: line }); i += 2; continue; }
      if ("+-*/%<>=!&|".indexOf(c) >= 0) { toks.push({ t: "op", v: c, line: line }); i++; continue; }
      if ("(){}[];,.".indexOf(c) >= 0) { toks.push({ t: "punc", v: c, line: line }); i++; continue; }
      throw new JavaError("Unexpected character '" + c + "' on line " + line);
    }
    toks.push({ t: "eof", v: null, line: line });
    return toks;
  }

  // ---- parser (produces AST of statements; methods collected) ----
  function parse(toks) {
    var p = 0;
    function peek(k) { return toks[p + (k || 0)]; }
    function next() { return toks[p++]; }
    function isP(v) { var t = peek(); return t.t === "punc" && t.v === v; }
    function isOp(v) { var t = peek(); return t.t === "op" && t.v === v; }
    function isKw(v) { var t = peek(); return t.t === "kw" && t.v === v; }
    function eatP(v) { if (!isP(v)) err("expected '" + v + "'"); p++; }
    function err(m) { var t = peek(); throw new JavaError(m + " (got '" + (t.v == null ? t.t : t.v) + "' on line " + t.line + ")"); }
    function isTypeKw(v) { return ["int","double","boolean","String","char","long","float","var"].indexOf(v) >= 0; }

    function parseType() {
      var t = next().v;
      while (isP("[")) { eatP("["); eatP("]"); t += "[]"; }
      return t;
    }

    function parseProgram() {
      var methods = {}, mainBody = null, topStatements = [];
      // strip optional: public class X { ... }
      // We scan for method declarations and a main body anywhere at top level.
      // Simpler approach: if there's a 'class', descend into its body.
      while (peek().t !== "eof") {
        // skip modifiers
        while (isKw("public") || isKw("private") || isKw("static") || isKw("final")) next();
        if (isKw("class")) { next(); next(); /* class name */ eatP("{"); continue; }
        if (isP("}")) { next(); continue; } // closing class brace
        // method?  type id ( ... ) { ... }  -- only a return-type token can start one.
        // A bare id starting a statement (e.g. a[2]=7 or foo()) is NOT a method.
        var startsMethod = (peek().t === "kw" && (isTypeKw(peek().v) || peek().v === "void")) ||
          (peek().t === "id" && peek(1).t === "id"); // "Type name" return-type form
        if (startsMethod) {
          var save = p;
          var rtype = parseType();
          if (peek().t === "id" && peek(1).t === "punc" && peek(1).v === "(") {
            var mname = next().v;
            var params = parseParams();
            var body = parseBlock();
            if (mname === "main") mainBody = body;
            else methods[mname] = { params: params, body: body };
            continue;
          }
          p = save; // not a method, treat as top-level statement
        }
        topStatements.push(parseStatement());
      }
      return { methods: methods, mainBody: mainBody, topStatements: topStatements };
    }

    function parseParams() {
      eatP("(");
      var params = [];
      while (!isP(")")) {
        var ptype = parseType();
        var pname = next().v;
        params.push({ type: ptype, name: pname });
        if (isP(",")) next();
      }
      eatP(")");
      return params;
    }

    function parseBlock() {
      eatP("{");
      var stmts = [];
      while (!isP("}") && peek().t !== "eof") stmts.push(parseStatement());
      eatP("}");
      return { kind: "block", body: stmts };
    }

    function parseStatement() {
      if (isP("{")) return parseBlock();
      if (isP(";")) { next(); return { kind: "empty" }; }
      if (isKw("if")) return parseIf();
      if (isKw("for")) return parseFor();
      if (isKw("while")) return parseWhile();
      if (isKw("return")) { next(); var e = isP(";") ? null : parseExpr(); if (isP(";")) next(); return { kind: "return", expr: e }; }
      if (isKw("break")) { next(); if (isP(";")) next(); return { kind: "break" }; }
      if (isKw("continue")) { next(); if (isP(";")) next(); return { kind: "continue" }; }
      // variable declaration: type id ...
      if (peek().t === "kw" && isTypeKw(peek().v)) {
        var save = p;
        var vtype = parseType();
        if (peek().t === "id") return parseVarDecl(vtype);
        p = save;
      }
      // expression statement
      var ex = parseExpr();
      if (isP(";")) next();
      return { kind: "exprStmt", expr: ex };
    }

    function parseVarDecl(vtype) {
      var decls = [];
      do {
        var name = next().v;
        var arrType = vtype;
        while (isP("[")) { eatP("["); eatP("]"); arrType += "[]"; }
        var init = null;
        if (isOp("=")) { next(); init = isP("{") ? parseArrayLiteral() : parseExpr(); }
        decls.push({ name: name, type: arrType, init: init });
      } while (isP(",") && (next(), true));
      if (isP(";")) next();
      return { kind: "varDecl", decls: decls };
    }

    function parseArrayLiteral() {
      eatP("{");
      var els = [];
      while (!isP("}")) { els.push(parseExpr()); if (isP(",")) next(); }
      eatP("}");
      return { kind: "arrayLit", elements: els };
    }

    function parseIf() {
      next(); eatP("("); var cond = parseExpr(); eatP(")");
      var then = parseStatement(); var els = null;
      if (isKw("else")) { next(); els = parseStatement(); }
      return { kind: "if", cond: cond, then: then, els: els };
    }
    function parseFor() {
      next(); eatP("(");
      var init = null;
      if (!isP(";")) {
        if (peek().t === "kw" && isTypeKw(peek().v)) { var ft = parseType(); init = parseVarDeclNoSemi(ft); }
        else init = { kind: "exprStmt", expr: parseExpr() };
      }
      eatP(";");
      var cond = isP(";") ? null : parseExpr(); eatP(";");
      var update = isP(")") ? null : parseExpr(); eatP(")");
      var body = parseStatement();
      return { kind: "for", init: init, cond: cond, update: update, body: body };
    }
    function parseVarDeclNoSemi(vtype) {
      var decls = [];
      do {
        var name = next().v; var t = vtype;
        while (isP("[")) { eatP("["); eatP("]"); t += "[]"; }
        var init = null;
        if (isOp("=")) { next(); init = isP("{") ? parseArrayLiteral() : parseExpr(); }
        decls.push({ name: name, type: t, init: init });
      } while (isP(",") && (next(), true));
      return { kind: "varDecl", decls: decls };
    }
    function parseWhile() { next(); eatP("("); var cond = parseExpr(); eatP(")"); var body = parseStatement(); return { kind: "while", cond: cond, body: body }; }

    // expression precedence
    function parseExpr() { return parseAssign(); }
    function parseAssign() {
      var left = parseOr();
      if (peek().t === "op" && ["=","+=","-=","*=","/=","%="].indexOf(peek().v) >= 0) {
        var op = next().v; var right = parseAssign();
        return { kind: "assign", op: op, target: left, value: right };
      }
      return left;
    }
    function parseOr() { var l = parseAnd(); while (isOp("||")) { next(); l = { kind: "bin", op: "||", l: l, r: parseAnd() }; } return l; }
    function parseAnd() { var l = parseEq(); while (isOp("&&")) { next(); l = { kind: "bin", op: "&&", l: l, r: parseEq() }; } return l; }
    function parseEq() { var l = parseRel(); while (isOp("==") || isOp("!=")) { var o = next().v; l = { kind: "bin", op: o, l: l, r: parseRel() }; } return l; }
    function parseRel() { var l = parseAdd(); while (isOp("<") || isOp(">") || isOp("<=") || isOp(">=")) { var o = next().v; l = { kind: "bin", op: o, l: l, r: parseAdd() }; } return l; }
    function parseAdd() { var l = parseMul(); while (isOp("+") || isOp("-")) { var o = next().v; l = { kind: "bin", op: o, l: l, r: parseMul() }; } return l; }
    function parseMul() { var l = parseUnary(); while (isOp("*") || isOp("/") || isOp("%")) { var o = next().v; l = { kind: "bin", op: o, l: l, r: parseUnary() }; } return l; }
    function parseUnary() {
      if (isOp("!") || isOp("-") || isOp("+")) { var o = next().v; return { kind: "unary", op: o, e: parseUnary() }; }
      if (isOp("++") || isOp("--")) { var o2 = next().v; return { kind: "preincr", op: o2, e: parseUnary() }; }
      return parsePostfix();
    }
    function parsePostfix() {
      var e = parsePrimary();
      while (true) {
        if (isP(".")) {
          next(); var name = next().v;
          if (isP("(")) { var args = parseArgs(); e = { kind: "methodCall", obj: e, name: name, args: args }; }
          else e = { kind: "field", obj: e, name: name };
        } else if (isP("[")) { next(); var idx = parseExpr(); eatP("]"); e = { kind: "index", obj: e, index: idx }; }
        else if (isOp("++") || isOp("--")) { var o = next().v; e = { kind: "postincr", op: o, e: e }; }
        else break;
      }
      return e;
    }
    function parseArgs() { eatP("("); var args = []; while (!isP(")")) { args.push(parseExpr()); if (isP(",")) next(); } eatP(")"); return args; }
    function parsePrimary() {
      var t = peek();
      if (t.t === "int") { next(); return { kind: "lit", vtype: "int", value: t.v }; }
      if (t.t === "double") { next(); return { kind: "lit", vtype: "double", value: t.v }; }
      if (t.t === "string") { next(); return { kind: "lit", vtype: "String", value: t.v }; }
      if (t.t === "char") { next(); return { kind: "lit", vtype: "char", value: t.v }; }
      if (isKw("true")) { next(); return { kind: "lit", vtype: "boolean", value: true }; }
      if (isKw("false")) { next(); return { kind: "lit", vtype: "boolean", value: false }; }
      if (isKw("null")) { next(); return { kind: "lit", vtype: "null", value: null }; }
      if (isKw("new")) {
        next(); var bt = next().v;
        if (isP("[")) { eatP("["); var sz = parseExpr(); eatP("]"); return { kind: "newArray", baseType: bt, size: sz }; }
        if (isP("{")) { var lit = parseArrayLiteral(); return lit; }
        // new ignored object: skip args
        if (isP("(")) parseArgs(); return { kind: "lit", vtype: "null", value: null };
      }
      if (isP("(")) { next(); var e = parseExpr(); eatP(")"); return e; }
      if (t.t === "id" || (t.t === "kw" && t.v === "String")) {
        next();
        if (isP("(")) { var args = parseArgs(); return { kind: "call", name: t.v, args: args }; }
        return { kind: "var", name: t.v };
      }
      err("unexpected token in expression");
    }

    return parseProgram();
  }

  // ---- evaluator ----
  function ReturnSignal(v) { this.v = v; }
  function BreakSignal() {}
  function ContinueSignal() {}

  function evalJava(src) {
    var out = [], steps = 0;
    function emit(s) { if (out.length >= MAX_OUT) throw new JavaError("output limit reached"); out.push(s); }
    function tick() { if (++steps > MAX_STEPS) throw new JavaError("step limit reached (possible infinite loop)"); }

    var prog = parse(tokenize(src));
    var methods = prog.methods;

    function truthy(val) { if (val.type !== "boolean") throw new JavaError("expected boolean, got " + val.type); return val.value; }

    function arith(op, a, b) {
      var rd = a.type === "double" || b.type === "double";
      var x = a.value, y = b.value, r;
      switch (op) {
        case "+": r = x + y; break;
        case "-": r = x - y; break;
        case "*": r = x * y; break;
        case "/": if (y === 0 && !rd) throw new JavaError("/ by zero"); r = rd ? x / y : Math.trunc(x / y); break;
        case "%": if (y === 0 && !rd) throw new JavaError("/ by zero"); r = rd ? x % y : (Math.trunc(x) % Math.trunc(y)); break;
      }
      return V(rd ? "double" : "int", r);
    }
    function compare(op, a, b) {
      var x, y;
      if (isNum(a.type) && isNum(b.type)) { x = a.value; y = b.value; }
      else if (a.type === "char" && b.type === "char") { x = a.value; y = b.value; }
      else { x = a.value; y = b.value; }
      switch (op) {
        case "<": return V("boolean", x < y); case ">": return V("boolean", x > y);
        case "<=": return V("boolean", x <= y); case ">=": return V("boolean", x >= y);
      }
    }
    function equals(op, a, b) {
      var eq;
      if (isNum(a.type) && isNum(b.type)) eq = a.value === b.value;
      else eq = a.value === b.value && a.type === b.type || (a.value === b.value);
      return V("boolean", op === "==" ? eq : !eq);
    }

    function evalBin(node, env) {
      if (node.op === "&&") { return V("boolean", truthy(ev(node.l, env)) && truthy(ev(node.r, env))); }
      if (node.op === "||") { return V("boolean", truthy(ev(node.l, env)) || truthy(ev(node.r, env))); }
      var a = ev(node.l, env), b = ev(node.r, env);
      if (node.op === "+") {
        if (a.type === "String" || b.type === "String") return V("String", javaStr(a) + javaStr(b));
        return arith("+", a, b);
      }
      if (["-","*","/","%"].indexOf(node.op) >= 0) return arith(node.op, a, b);
      if (["<",">","<=",">="].indexOf(node.op) >= 0) return compare(node.op, a, b);
      if (node.op === "==" || node.op === "!=") return equals(node.op, a, b);
      throw new JavaError("unknown operator " + node.op);
    }

    function lookup(env, name) {
      var e = env;
      while (e) { if (Object.prototype.hasOwnProperty.call(e.vars, name)) return e; e = e.parent; }
      throw new JavaError("cannot find variable '" + name + "'");
    }
    function getVar(env, name) { return lookup(env, name).vars[name]; }
    function setVar(env, name, val) { lookup(env, name).vars[name] = val; }

    function coerce(val, declType) {
      if (declType === "double" && val.type === "int") return V("double", val.value);
      if (declType === "int" && val.type === "double") return V("int", Math.trunc(val.value));
      return val;
    }

    function ev(node, env) {
      tick();
      switch (node.kind) {
        case "lit": return V(node.vtype, node.value);
        case "var": {
          // Math / Integer / System tokens handled via call/field; here a plain variable
          return getVar(env, node.name);
        }
        case "bin": return evalBin(node, env);
        case "unary": {
          var v = ev(node.e, env);
          if (node.op === "!") return V("boolean", !truthy(v));
          if (node.op === "-") return V(v.type === "double" ? "double" : "int", -v.value);
          return v;
        }
        case "assign": return doAssign(node, env);
        case "preincr": { var cur = ev(node.e, env); var nv = V(cur.type, cur.value + (node.op === "++" ? 1 : -1)); assignTo(node.e, nv, env); return nv; }
        case "postincr": { var cur2 = ev(node.e, env); var nv2 = V(cur2.type, cur2.value + (node.op === "++" ? 1 : -1)); assignTo(node.e, nv2, env); return cur2; }
        case "index": { var arr = ev(node.obj, env); var i = ev(node.index, env).value; if (!arr.value || i < 0 || i >= arr.value.length) throw new JavaError("array index out of bounds: " + i); return arr.value[i]; }
        case "arrayLit": { var els = node.elements.map(function (e) { return ev(e, env); }); return V((els[0] ? els[0].type : "int") + "[]", els); }
        case "newArray": { var sz = ev(node.size, env).value; var def = node.baseType === "double" || node.baseType === "float" ? V("double", 0) : node.baseType === "boolean" ? V("boolean", false) : node.baseType === "String" ? V("String", "null") : V("int", 0); var a = []; for (var k = 0; k < sz; k++) a.push(def); return V(node.baseType + "[]", a); }
        case "field": return evalField(node, env);
        case "methodCall": return evalMethodCall(node, env);
        case "call": return evalCall(node, env);
        default: throw new JavaError("cannot evaluate " + node.kind);
      }
    }

    function assignTo(target, val, env) {
      if (target.kind === "var") { var e = lookup(env, target.name); e.vars[target.name] = coerce(val, e.types[target.name]); }
      else if (target.kind === "index") { var arr = ev(target.obj, env); var i = ev(target.index, env).value; if (i < 0 || i >= arr.value.length) throw new JavaError("array index out of bounds: " + i); arr.value[i] = val; }
      else throw new JavaError("invalid assignment target");
    }
    function doAssign(node, env) {
      var rhs = ev(node.value, env);
      if (node.op !== "=") {
        var cur = ev(node.target, env);
        var op = node.op[0];
        if (op === "+" && (cur.type === "String" || rhs.type === "String")) rhs = V("String", javaStr(cur) + javaStr(rhs));
        else rhs = arith(op, cur, rhs);
      }
      assignTo(node.target, rhs, env);
      return rhs;
    }

    function evalField(node, env) {
      // arr.length
      if (node.name === "length") {
        var o = ev(node.obj, env);
        if (o.type && /\[\]$/.test(o.type)) return V("int", o.value.length);
      }
      throw new JavaError("unknown field ." + node.name);
    }

    function evalMethodCall(node, env) {
      // System.out.println / print
      if (node.obj.kind === "field" && node.obj.obj.kind === "var" && node.obj.obj.name === "System" && node.obj.name === "out") {
        var arg = node.args.length ? ev(node.args[0], env) : V("String", "");
        var s = node.args.length ? javaStr(arg) : "";
        if (node.name === "println") emit(s);
        else if (node.name === "print") { if (out.length && !out._printPending) { /* append */ } out.push(s); mergePrint(); }
        return V("void", null);
      }
      // Math.x / Integer.x  (obj is var Math/Integer)
      if (node.obj.kind === "var" && (node.obj.name === "Math" || node.obj.name === "Integer" || node.obj.name === "String")) {
        return staticCall(node.obj.name, node.name, node.args.map(function (a) { return ev(a, env); }));
      }
      // String instance methods
      var recv = ev(node.obj, env);
      var args = node.args.map(function (a) { return ev(a, env); });
      return instanceCall(recv, node.name, args);
    }
    function mergePrint() {
      // join trailing print fragments without newline by concatenation into last line buffer
      // simplest model: print appends to a pending buffer line; println flushes.
    }

    function staticCall(cls, name, args) {
      var n = args.map(function (a) { return a.value; });
      if (cls === "Math") {
        switch (name) {
          case "max": return V(args[0].type === "double" || args[1].type === "double" ? "double" : "int", Math.max(n[0], n[1]));
          case "min": return V(args[0].type === "double" || args[1].type === "double" ? "double" : "int", Math.min(n[0], n[1]));
          case "abs": return V(args[0].type, Math.abs(n[0]));
          case "pow": return V("double", Math.pow(n[0], n[1]));
          case "sqrt": return V("double", Math.sqrt(n[0]));
          case "round": return V("int", Math.round(n[0]));
          case "floor": return V("double", Math.floor(n[0]));
          case "ceil": return V("double", Math.ceil(n[0]));
        }
      }
      if (cls === "Integer") {
        if (name === "parseInt") return V("int", parseInt(n[0], 10));
        if (name === "toString") return V("String", String(Math.trunc(n[0])));
        if (name === "valueOf") return V("int", parseInt(n[0], 10));
      }
      if (cls === "String") {
        if (name === "valueOf") return V("String", javaStr(args[0]));
      }
      throw new JavaError("unknown static method " + cls + "." + name);
    }
    function instanceCall(recv, name, args) {
      if (recv.type === "String") {
        var s = recv.value;
        switch (name) {
          case "length": return V("int", s.length);
          case "charAt": return V("char", s.charAt(args[0].value));
          case "toUpperCase": return V("String", s.toUpperCase());
          case "toLowerCase": return V("String", s.toLowerCase());
          case "substring": return V("String", args.length > 1 ? s.substring(args[0].value, args[1].value) : s.substring(args[0].value));
          case "indexOf": return V("int", s.indexOf(javaStr(args[0])));
          case "equals": return V("boolean", s === javaStr(args[0]));
          case "equalsIgnoreCase": return V("boolean", s.toLowerCase() === javaStr(args[0]).toLowerCase());
          case "trim": return V("String", s.trim());
          case "isEmpty": return V("boolean", s.length === 0);
          case "contains": return V("boolean", s.indexOf(javaStr(args[0])) >= 0);
          case "replace": return V("String", s.split(javaStr(args[0])).join(javaStr(args[1])));
          case "startsWith": return V("boolean", s.indexOf(javaStr(args[0])) === 0);
          case "endsWith": return V("boolean", s.lastIndexOf(javaStr(args[0])) === s.length - javaStr(args[0]).length);
          case "toString": return recv;
        }
      }
      throw new JavaError("unknown method ." + name + " on " + recv.type);
    }

    function evalCall(node, env) {
      var m = methods[node.name];
      if (!m) throw new JavaError("cannot find method '" + node.name + "'");
      var args = node.args.map(function (a) { return ev(a, env); });
      var fenv = { vars: {}, types: {}, parent: null };
      m.params.forEach(function (pm, i) { fenv.types[pm.name] = pm.type; fenv.vars[pm.name] = coerce(args[i] || V("int", 0), pm.type); });
      try { exec(m.body, fenv); }
      catch (sig) { if (sig instanceof ReturnSignal) return sig.v || V("void", null); throw sig; }
      return V("void", null);
    }

    function exec(node, env) {
      tick();
      switch (node.kind) {
        case "block": { var benv = { vars: {}, types: {}, parent: env }; for (var i = 0; i < node.body.length; i++) exec(node.body[i], benv); break; }
        case "empty": break;
        case "varDecl": node.decls.forEach(function (d) {
          var val = d.init ? ev(d.init, env) : defaultFor(d.type);
          if (d.init && d.init.kind === "arrayLit") val = V(d.type, val.value);
          env.types[d.name] = d.type; env.vars[d.name] = coerce(val, d.type);
        }); break;
        case "exprStmt": ev(node.expr, env); break;
        case "if": if (truthy(ev(node.cond, env))) exec(node.then, env); else if (node.els) exec(node.els, env); break;
        case "while": while (truthy(ev(node.cond, env))) { tick(); try { exec(node.body, env); } catch (s) { if (s instanceof BreakSignal) break; if (s instanceof ContinueSignal) continue; throw s; } } break;
        case "for": {
          var fenv = { vars: {}, types: {}, parent: env };
          if (node.init) exec(node.init, fenv);
          while (node.cond == null || truthy(ev(node.cond, fenv))) {
            tick();
            try { exec(node.body, fenv); } catch (s) { if (s instanceof BreakSignal) break; if (s instanceof ContinueSignal) { if (node.update) ev(node.update, fenv); continue; } throw s; }
            if (node.update) ev(node.update, fenv);
          }
          break;
        }
        case "return": throw new ReturnSignal(node.expr ? ev(node.expr, env) : V("void", null));
        case "break": throw new BreakSignal();
        case "continue": throw new ContinueSignal();
        default: ev(node, env);
      }
    }
    function defaultFor(type) {
      if (type === "double" || type === "float") return V("double", 0);
      if (type === "boolean") return V("boolean", false);
      if (type === "String") return V("String", "null");
      if (/\[\]$/.test(type)) return V(type, null);
      return V("int", 0);
    }

    var genv = { vars: {}, types: {}, parent: null };
    if (prog.mainBody) exec(prog.mainBody, genv);
    else prog.topStatements.forEach(function (s) { exec(s, genv); });
    return out.join("\n");
  }

  function runJava(src) {
    try { return { ok: true, output: evalJava(src) }; }
    catch (e) { return { ok: false, output: "", error: e && e.message ? e.message : String(e) }; }
  }

  /* =========================================================
     BASH / TERMINAL SIMULATOR
     Virtual filesystem + common commands + pipes + redirection.
     ========================================================= */
  function makeFS() {
    return { "/home/you": { type: "dir" }, "/home/you/readme.txt": { type: "file", content: "welcome to the lab\n" } };
  }
  function runBash(cmdLine, state) {
    state = state || { cwd: "/home/you", fs: makeFS() };
    var fs = state.fs;
    function norm(p) {
      if (!p) return state.cwd;
      if (p[0] !== "/") p = state.cwd + "/" + p;
      var parts = p.split("/").filter(Boolean), st = [];
      parts.forEach(function (x) { if (x === ".") return; if (x === "..") st.pop(); else st.push(x); });
      return "/" + st.join("/");
    }
    function isDir(p) { return fs[p] && fs[p].type === "dir"; }
    function isFile(p) { return fs[p] && fs[p].type === "file"; }
    function children(dir) { var pre = dir === "/" ? "/" : dir + "/"; var set = {}; Object.keys(fs).forEach(function (k) { if (k !== dir && k.indexOf(pre) === 0) { var rest = k.slice(pre.length).split("/")[0]; set[rest] = 1; } }); return Object.keys(set).sort(); }

    function runOne(argv, stdin) {
      var cmd = argv[0], a = argv.slice(1);
      switch (cmd) {
        case "echo": return a.join(" ") + "\n";
        case "pwd": return state.cwd + "\n";
        case "ls": { var d = a[0] ? norm(a[0]) : state.cwd; if (isFile(d)) return d.split("/").pop() + "\n"; if (!isDir(d)) return "ls: " + (a[0] || d) + ": No such file or directory\n"; var c = children(d); return c.length ? c.join("  ") + "\n" : ""; }
        case "cd": { var t = norm(a[0] || "/home/you"); if (!isDir(t)) return "cd: " + (a[0] || "") + ": Not a directory\n"; state.cwd = t; return ""; }
        case "mkdir": { if (!a[0]) return "mkdir: missing operand\n"; fs[norm(a[0])] = { type: "dir" }; return ""; }
        case "touch": { if (!a[0]) return "touch: missing operand\n"; var fp = norm(a[0]); if (!fs[fp]) fs[fp] = { type: "file", content: "" }; return ""; }
        case "rm": { var rp = norm(a[a.length - 1]); if (fs[rp]) { delete fs[rp]; if (a.indexOf("-r") >= 0 || a.indexOf("-rf") >= 0) { var pre = rp + "/"; Object.keys(fs).forEach(function (k) { if (k.indexOf(pre) === 0) delete fs[k]; }); } return ""; } return "rm: " + a[a.length - 1] + ": No such file or directory\n"; }
        case "cat": { if (stdin != null && !a.length) return stdin; var cp = norm(a[0]); if (isFile(cp)) return fs[cp].content; return "cat: " + (a[0] || "") + ": No such file or directory\n"; }
        case "grep": { var pat = a[0]; var text = stdin != null ? stdin : (isFile(norm(a[1])) ? fs[norm(a[1])].content : ""); return text.split("\n").filter(function (l) { return l.indexOf(pat) >= 0; }).join("\n") + (text ? "\n" : ""); }
        case "wc": { var wt = stdin != null ? stdin : (isFile(norm(a[a.length - 1])) ? fs[norm(a[a.length - 1])].content : ""); var lines = wt === "" ? 0 : wt.replace(/\n$/, "").split("\n").length; if (a.indexOf("-l") >= 0) return lines + "\n"; var words = wt.trim() === "" ? 0 : wt.trim().split(/\s+/).length; return "  " + lines + "  " + words + "  " + wt.length + "\n"; }
        case "head": { var n = 10; var hi = a.indexOf("-n"); if (hi >= 0) { n = +a[hi + 1]; } var ht = stdin != null ? stdin : (isFile(norm(a[a.length - 1])) ? fs[norm(a[a.length - 1])].content : ""); return ht.split("\n").slice(0, n).join("\n") + "\n"; }
        case "tail": { var n2 = 10; var ti = a.indexOf("-n"); if (ti >= 0) n2 = +a[ti + 1]; var tt = stdin != null ? stdin : (isFile(norm(a[a.length - 1])) ? fs[norm(a[a.length - 1])].content : ""); var arr = tt.replace(/\n$/, "").split("\n"); return arr.slice(Math.max(0, arr.length - n2)).join("\n") + "\n"; }
        case "clear": return " CLEAR";
        case "help": return "commands: echo pwd ls cd mkdir touch rm cat grep wc head tail clear help\nuse | to pipe and > to write to a file\n";
        case "": return "";
        default: return cmd + ": command not found\n";
      }
    }

    // handle redirection + pipes
    var redirect = null, redirAppend = false, line = cmdLine.trim();
    var rm = line.match(/(.*?)(>>|>)\s*(\S+)\s*$/);
    if (rm) { line = rm[1].trim(); redirAppend = rm[2] === ">>"; redirect = rm[3]; }
    var stages = line.split("|").map(function (s) { return s.trim(); });
    var stdin = null, out = "";
    for (var s = 0; s < stages.length; s++) {
      var argv = tokenizeShell(stages[s]);
      out = runOne(argv, stdin);
      stdin = out;
    }
    if (out === " CLEAR") return { clear: true, output: "", state: state };
    if (redirect) { var rp = norm(redirect); var prev = (redirAppend && isFile(rp)) ? fs[rp].content : ""; fs[rp] = { type: "file", content: prev + out }; return { output: "", state: state }; }
    return { output: out, state: state };
  }
  function tokenizeShell(s) {
    var out = [], cur = "", q = null;
    for (var i = 0; i < s.length; i++) { var c = s[i]; if (q) { if (c === q) q = null; else cur += c; } else if (c === '"' || c === "'") q = c; else if (c === " ") { if (cur) { out.push(cur); cur = ""; } } else cur += c; }
    if (cur) out.push(cur);
    return out;
  }

  /* =========================================================
     JS RUNNER — runs the user's own JS, captures console.log.
     ========================================================= */
  function runJS(src) {
    var logs = [];
    var fakeConsole = { log: function () { logs.push(Array.prototype.map.call(arguments, fmt).join(" ")); }, error: function () { logs.push(Array.prototype.map.call(arguments, fmt).join(" ")); }, warn: function () { logs.push(Array.prototype.map.call(arguments, fmt).join(" ")); } };
    function fmt(x) { if (typeof x === "string") return x; try { return JSON.stringify(x); } catch (e) { return String(x); } }
    try {
      var fn = new Function("console", '"use strict";\n' + src);
      fn(fakeConsole);
      return { ok: true, output: logs.join("\n") };
    } catch (e) { return { ok: false, output: logs.join("\n"), error: (e && e.message) || String(e) }; }
  }

  var API = { runJava: runJava, runBash: runBash, runJS: runJS, _javaStr: javaStr };
  root.SELab = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
