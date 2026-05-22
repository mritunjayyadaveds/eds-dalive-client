export default async function decorate(block) {
  block.textContent = '';

  const loading = document.createElement('div');
  loading.className = 'countries-loading';
  loading.textContent = 'Loading countries...';
  block.append(loading);

  try {
    const resp = await fetch('https://restcountries.com/v3.1/all?fields=name');
    const data = await resp.json();

    const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));

    loading.remove();

    const wrapper = document.createElement('div');
    wrapper.className = 'countries-dropdown-wrapper';

    const label = document.createElement('label');
    label.className = 'countries-label';
    label.setAttribute('for', 'countries-select');
    label.textContent = 'Select a Country';

    const select = document.createElement('select');
    select.className = 'countries-select';
    select.id = 'countries-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choose a country...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.append(defaultOption);

    sorted.forEach((country) => {
      const option = document.createElement('option');
      option.value = country.name.common;
      option.textContent = country.name.common;
      select.append(option);
    });

    const info = document.createElement('div');
    info.className = 'countries-info';
    info.textContent = `${sorted.length} countries available`;

    select.addEventListener('change', () => {
      const selected = sorted.find((c) => c.name.common === select.value);
      if (selected) {
        info.textContent = `${selected.name.common} — ${selected.name.official}`;
      }
    });

    wrapper.append(label);
    wrapper.append(select);
    wrapper.append(info);
    block.append(wrapper);
  } catch (error) {
    loading.textContent = 'Failed to load countries.';
  }
}
