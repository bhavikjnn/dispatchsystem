"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface FilterPanelProps {
  onFilter: (filters: Record<string, any>) => void
}

interface FilterOptions {
  companies: string[]
  destinations: string[]
  transporters: string[]
  bookingTypes: string[]
  paymentStatuses: string[]
}

export default function AdminFilterPanel({ onFilter }: FilterPanelProps) {
  const [filters, setFilters] = useState({
    company: "",
    destination: "",
    transporter: "",
    bookingType: "",
    paidOrToPay: "",
    startDate: "",
    endDate: "",
  })

  const [options, setOptions] = useState<FilterOptions>({
    companies: [],
    destinations: [],
    transporters: [],
    bookingTypes: [],
    paymentStatuses: [],
  })

  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch("/api/orders/filter-options")
        if (response.ok) {
          const data = await response.json()
          setOptions(data)
        }
      } catch (error) {
        console.error("Error fetching filter options:", error)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchFilterOptions()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleApplyFilters = () => {
    onFilter(filters)
  }

  const handleReset = () => {
    setFilters({
      company: "",
      destination: "",
      transporter: "",
      bookingType: "",
      paidOrToPay: "",
      startDate: "",
      endDate: "",
    })
    onFilter({})
  }

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length

  return (
    <Card className="p-8 bg-card border border-border">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Filter Orders</h3>
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0
              ? `${activeFilterCount} active filter${activeFilterCount !== 1 ? "s" : ""}`
              : "Refine your search using the filters below"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
          <input
            type="text"
            name="company"
            value={filters.company}
            onChange={handleChange}
            placeholder="Search company..."
            list="companies-list"
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
          />
          <datalist id="companies-list">
            {options.companies.map((company) => (
              <option key={company} value={company} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Destination</label>
          <input
            type="text"
            name="destination"
            value={filters.destination}
            onChange={handleChange}
            placeholder="Search destination..."
            list="destinations-list"
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
          />
          <datalist id="destinations-list">
            {options.destinations.map((dest) => (
              <option key={dest} value={dest} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Transporter</label>
          <input
            type="text"
            name="transporter"
            value={filters.transporter}
            onChange={handleChange}
            placeholder="Search transporter..."
            list="transporters-list"
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
          />
          <datalist id="transporters-list">
            {options.transporters.map((trans) => (
              <option key={trans} value={trans} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Booking Type</label>
          <select
            name="bookingType"
            value={filters.bookingType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
          >
            <option value="">All Types</option>
            {options.bookingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Payment Status</label>
          <select
            name="paidOrToPay"
            value={filters.paidOrToPay}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg text-sm bg-input text-foreground input-focus"
          >
            <option value="">All Status</option>
            {options.paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
          <Input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
          <Input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="w-full bg-input border border-border text-foreground input-focus rounded-lg px-4 py-2"
          />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleApplyFilters} className="button-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 00-1 1v2c0 .552.224 1.052.586 1.414l9 9a1 1 0 001.414 0l9-9A1.414 1.414 0 0022 7V5a1 1 0 00-1-1h-2c-.552 0-1.052.224-1.414.586l-9 9a1 1 0 01-1.414 0l-9-9A1.414 1.414 0 003 4z"
            />
          </svg>
          Apply Filters
        </Button>
        <Button onClick={handleReset} className="button-secondary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reset
        </Button>
      </div>
    </Card>
  )
}
