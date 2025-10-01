"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("middleware",{

/***/ "(middleware)/./middleware.ts":
/*!***********************!*\
  !*** ./middleware.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   middleware: () => (/* binding */ middleware)\n/* harmony export */ });\n/* harmony import */ var _lib_supabase_middleware__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/supabase/middleware */ \"(middleware)/./lib/supabase/middleware.ts\");\n\nasync function middleware(request) {\n    return await (0,_lib_supabase_middleware__WEBPACK_IMPORTED_MODULE_0__.updateSession)(request);\n}\nconst config = {\n    matcher: [\n        /*\n     * Match all request paths except:\n     * - _next/static (static files)\n     * - _next/image (image optimization files)\n     * - favicon.ico (favicon file)\n     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp\n     */ \"/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)\"\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbWlkZGxld2FyZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBeUQ7QUFHbEQsZUFBZUMsV0FBV0MsT0FBb0I7SUFDbkQsT0FBTyxNQUFNRix1RUFBYUEsQ0FBQ0U7QUFDN0I7QUFFTyxNQUFNQyxTQUFTO0lBQ3BCQyxTQUFTO1FBQ1A7Ozs7OztLQU1DLEdBQ0Q7S0FDRDtBQUNILEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vbWlkZGxld2FyZS50cz80MjJkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVwZGF0ZVNlc3Npb24gfSBmcm9tIFwiQC9saWIvc3VwYWJhc2UvbWlkZGxld2FyZVwiXG5pbXBvcnQgdHlwZSB7IE5leHRSZXF1ZXN0IH0gZnJvbSBcIm5leHQvc2VydmVyXCJcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZGRsZXdhcmUocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcbiAgcmV0dXJuIGF3YWl0IHVwZGF0ZVNlc3Npb24ocmVxdWVzdClcbn1cblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IHtcbiAgbWF0Y2hlcjogW1xuICAgIC8qXG4gICAgICogTWF0Y2ggYWxsIHJlcXVlc3QgcGF0aHMgZXhjZXB0OlxuICAgICAqIC0gX25leHQvc3RhdGljIChzdGF0aWMgZmlsZXMpXG4gICAgICogLSBfbmV4dC9pbWFnZSAoaW1hZ2Ugb3B0aW1pemF0aW9uIGZpbGVzKVxuICAgICAqIC0gZmF2aWNvbi5pY28gKGZhdmljb24gZmlsZSlcbiAgICAgKiAtIGltYWdlcyAtIC5zdmcsIC5wbmcsIC5qcGcsIC5qcGVnLCAuZ2lmLCAud2VicFxuICAgICAqL1xuICAgIFwiLygoPyFfbmV4dC9zdGF0aWN8X25leHQvaW1hZ2V8ZmF2aWNvbi5pY298LipcXFxcLig/OnN2Z3xwbmd8anBnfGpwZWd8Z2lmfHdlYnApJCkuKilcIixcbiAgXSxcbn1cbiJdLCJuYW1lcyI6WyJ1cGRhdGVTZXNzaW9uIiwibWlkZGxld2FyZSIsInJlcXVlc3QiLCJjb25maWciLCJtYXRjaGVyIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./middleware.ts\n");

/***/ })

});