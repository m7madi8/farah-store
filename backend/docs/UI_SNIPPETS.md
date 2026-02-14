# Admin UI Snippets

Reusable snippets matching the current purple brand theme.

## Navigation Header

```html
<header class="rounded-2xl border border-adminBrand-200 bg-white p-4 shadow-md">
  <div class="flex items-center justify-between gap-3">
    <h2 class="font-display text-2xl font-semibold text-adminBrand-800">Dashboard</h2>
    <button class="ui-btn-primary">Create Item</button>
  </div>
</header>
```

## Stats Cards

```html
<div class="admin-dashboard-grid">
  <article class="admin-stat-card">
    <p class="admin-stat-label">Orders</p>
    <p class="admin-stat-value">128</p>
  </article>
</div>
```

## Table

```html
<div class="results">
  <table id="result_list">
    <thead>
      <tr><th><a href="#">Name</a></th><th><a href="#">Status</a></th></tr>
    </thead>
    <tbody>
      <tr><td>Sample</td><td>Active</td></tr>
    </tbody>
  </table>
</div>
```

## Form Controls

```html
<div class="form-row">
  <label for="id_name">Name</label>
  <input id="id_name" type="text" />
</div>
<div class="submit-row">
  <input type="submit" value="Save" />
</div>
```

## Modal-like Popup (Django related object windows)

```html
<body class="popup">
  <div id="container">
    <div id="content">...</div>
  </div>
</body>
```
