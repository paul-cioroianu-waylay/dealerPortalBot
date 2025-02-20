class Dashboard {
  client = null
  map = null
  groupLowerLeftChart = null
  groupLowerRightChart = null
  individualLowerLeftChart = null
  individualLowerRightChart = null
  resourceImage = null


  setClient(client) {
    this.client = client
  }


  async drawGroupResourcesDashboard(opts = { onlyCharts: false }) {
    const canvasDiv = document.getElementById('canvas')
    if (!opts.onlyCharts) {
      canvasDiv.style.transition = 'none'
      canvasDiv.style.opacity = '0'
    }
    let response = await this.client.resources.search({ tags: 'DealerPortal' })
    let resources = response.values
    if (!opts.onlyCharts) {
      // Recreate table and map
      this.createResourceTable(resources)
      this.drawMap(resources)
    }
    this.removeCharts({ removeIndividualCharts: true })
    this.createGroupCharts(resources)
    if (!opts.onlyCharts) {
      // Restore transition and fade-in smoothly after a small delay
      setTimeout(() => {
        canvasDiv.style.transition = 'opacity 0.5s ease-in-out'  // Restore transition
        canvasDiv.style.opacity = '1'  // Smooth fade-in
      }, 50) // Short delay to prevent flash effect
    }
  }

  createResourceTable(resources) {
    const upperLeftCanvas = document.getElementById('upperLeftCanvas')
    upperLeftCanvas.className = 'upperLeftCanvas markdown-body'
    upperLeftCanvas.style.backgroundColor = 'inherit'
    // Remove existing table if it exists
    const existingTable = upperLeftCanvas.querySelector('table')
    if (existingTable) {
      upperLeftCanvas.removeChild(existingTable)
    }
    let selectedCheckbox = null
    // Create table
    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse'
    // Create header row
    const headerRow = document.createElement('tr')
    const headers = ['ID', 'Name', 'Product', 'Account', 'AI Health Score', 'Selected']
    headers.forEach(headerText => {
      const th = document.createElement('th')
      th.textContent = headerText
      headerRow.appendChild(th)
    })
    // Append header row to the table
    table.appendChild(headerRow)
    // Populate table rows with resource data
    resources.forEach(resource => {
      const row = document.createElement('tr')
      // Create and append each table cell
      const properties = ['id', 'name', 'resourceTypeId', 'Account', 'AI Health Score']
      properties.forEach(prop => {
        const td = document.createElement('td')
        td.textContent = resource[prop] || 'N/A'
        row.appendChild(td)
      })
      // Create 'Selected' column with checkbox
      const checkboxTd = document.createElement('td')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkboxTd.style.textAlign = 'center'
      checkboxTd.style.verticalAlign = 'middle'
      checkbox.dataset.id = resource.id
      checkbox.addEventListener('change', (event) => {
        if (selectedCheckbox && selectedCheckbox !== checkbox) {
          selectedCheckbox.checked = false
        }
        if (checkbox.checked) {
          selectedCheckbox = checkbox
          this.removeCharts({ removeGroupCharts: true })
          this.drawSingleResourceDashboard(event.target.dataset.id)
        } else {
          selectedCheckbox = null
          this.removeCharts({ removeIndividualCharts: true })
          this.drawGroupResourcesDashboard({ onlyCharts: true })
          this.drawMap(resources)
        }
      })
      checkboxTd.appendChild(checkbox)
      row.appendChild(checkboxTd)
      // Append row to the table
      table.appendChild(row)
    })
    // Append the table to the upperLeftCanvas element
    upperLeftCanvas.appendChild(table)
  }

  removeCharts(opts = { removeGroupCharts: true, removeIndividualCharts: true }) {
    if (opts.removeGroupCharts) {
      if (this.groupLowerLeftChart) {
        this.groupLowerLeftChart.destroy()
        this.groupLowerLeftChart = null

      }
      if (this.groupLowerRightChart) {
        this.groupLowerRightChart.destroy()
        this.groupLowerRightChart = null
      }
    } else if (opts.removeIndividualCharts) {
      if (this.individualLowerLeftChart) {
        this.individualLowerLeftChart.destroy()
        this.individualLowerLeftChart = null

      }
      if (this.individualLowerRightChart) {
        this.individualLowerRightChart.destroy()
        this.individualLowerRightChart = null
      }
    }
  }

  drawMap(resources) {
    if (this.resourceImage) {
      this.resourceImage.remove()
      this.resourceImage = null
    }

    const resMapDiv = document.getElementById('resMap')
    if (!resMapDiv) {
      console.error('resMap not found.')
      return
    }

    if (!this.map) {
      // Create map only if it doesn't exist
      this.map = L.map('resMap').setView([resources[0].latitude, resources[0].longitude], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map)
    } else {
      // If the map exists, just update the view
      this.map.setView([resources[0].latitude, resources[0].longitude], 12)
    }

    // Clear existing markers before adding new ones
    this.map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer)
      }
    })

    // Add new markers
    resources.forEach(resource => {
      L.marker([resource.latitude, resource.longitude])
        .addTo(this.map)
        .bindPopup('ID: ' + resource.id)
        .openPopup()
    })

    console.log('Map updated with new markers.')
  }

  createGroupCharts(resources) {
    const perType = {}
    const perAccount = {}
    console.log('createPieCharts', resources)
    resources.forEach(item => {
      if (item.resourceTypeId in perType) {
        perType[item.resourceTypeId]++
      } else {
        perType[item.resourceTypeId] = 1
      }
      if (item.Account in perAccount) {
        perAccount[item.Account]++
      } else {
        perAccount[item.Account] = 1
      }

    })

    let options = {
      chart: {
        type: 'pie',
        height: '100%',
        width: '100%',
      },
      title: {
        text: 'Pie Chart',
        align: 'center',
        style: {
          color: 'var(--color-fg-default)',
        },
      },
      legend: { show: false },
    }

    this.createGroupLeftChart(perType, options)
    this.createGroupRightChart(perAccount, options)
  }

  createGroupLeftChart(perType, options) {
    options.title.text = 'Assets per type'
    options.series = Object.values(perType)
    options.labels = Object.keys(perType)
    const chartElement = document.getElementById('leftPieChart')
    if (this.groupLowerLeftChart) {
      //  If chart exists, update it instead of recreating
      this.groupLowerLeftChart.updateOptions({
        series: options.series,
        labels: options.labels,
      })
    } else {
      //  Create a new chart if it doesn't exist
      this.groupLowerLeftChart = new ApexCharts(chartElement, options)
      this.groupLowerLeftChart.render()
    }
  }

  createGroupRightChart(perAccount, options) {
    options.title.text = 'Assets per Account'
    options.series = Object.values(perAccount)
    options.labels = Object.keys(perAccount)

    let chartElement = document.getElementById('rightPieChart')

    if (this.groupLowerRightChart) {
      //  If chart exists, update it instead of recreating
      this.groupLowerRightChart.updateOptions({
        series: options.series,
        labels: options.labels,
      })
    } else {
      //  Create a new chart if it doesn't exist
      this.groupLowerRightChart = new ApexCharts(chartElement, options)
      this.groupLowerRightChart.render()
    }
  }


  async drawSingleResourceDashboard(resource) {
    //6hrs ago
    const fuelResponse = await client.data.getMetricSeries(resource, 'fuel level'/*, { from: Date.now() - (6 * 60 * 60 * 1000) }*/)
    const hoursResponse = await client.data.getMetricSeries(resource, 'running hours', { from: Date.now() - (6 * 60 * 60 * 1000) })
    const imageBlob = await this.fetchResourceImage(resource)
    this.createFuelBarChart(fuelResponse.series)
    this.createRunningHoursLineChart(hoursResponse.series)
    this.drawResourceImage(imageBlob)
  }

  createFuelBarChart(fuelSeries) {
    const options = {
      title: {
        text: 'Fuel Levels',
      },
      chart: {
        type: 'bar',
        height: '100%',
        width: '150%',
      },
      colors: ['#ff8157'],
      plotOptions: {
        bar: {
          horizontal: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      series: [{
        name: 'value',
        data: fuelSeries.map(data => ({ x: new Date(data[0]), y: data[1] })),
      }],
      xaxis: {
        type: 'datetime',
        title: 'timestamp',
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            return value.toFixed(2)
          },
        },
      },
    }
    if (this.individualLowerLeftChart) {
      this.individualLowerLeftChart.updateOptions({ series: options.series })
    } else {
      const chartElement = document.getElementById('leftPieChart')
      const chart = new ApexCharts(chartElement, options)
      this.individualLowerLeftChart = chart
      chart.render()
    }
  }

  createRunningHoursLineChart(hoursSeries) {
    const options = {
      title: {
        text: 'Running Hours',
      },
      chart: {
        type: 'line',
        height: '100%',
        width: '150%',
      },
      dataLabels: {
        enabled: false,
      },
      series: [{
        name: 'value',
        data: hoursSeries.map(data => ({ x: new Date(data[0]), y: data[1] })),
      }],
      stroke: {
        curve: 'straight',
      },
      xaxis: {
        type: 'datetime',
        title: 'timestamp',
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            return value.toFixed(2)
          },
        },
      },
      colors: ['#00E396'],
    }
    if (this.individualLowerRightChart) {
      this.individualLowerRightChart.updateOptions({ series: options.series })
    } else {
      const chartElement = document.getElementById('rightPieChart')
      const chart = new ApexCharts(chartElement, options)
      this.individualLowerRightChart = chart
      chart.render()
    }
  }

  drawResourceImage(blob) {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
    const imgURL = URL.createObjectURL(blob) // Create Object URL

    //let imgElement = document.getElementById('resourceImage') // Find existing image
    if (!this.resourceImage) {
      // If image doesn't exist, create a new one
      const imgElement = document.createElement('img')
      imgElement.id = 'resourceImage' // Set an ID for easy reference
      imgElement.alt = 'Fetched Image'
      imgElement.style.maxWidth = '100%'
      document.getElementById('resMap').appendChild(imgElement)
      this.resourceImage = imgElement
    }
    // Update the existing image source
    this.resourceImage.src = imgURL
  }

  async fetchResourceImage(resource) {
    const signGet = await client.storage.object.signGet('assets', resource + '.png')
    console.log(signGet._links.get_object)
    const response = await fetch(signGet._links.get_object.href, {
      method: 'GET',

    })
    return response.blob()
  }
}
