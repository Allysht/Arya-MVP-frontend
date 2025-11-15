/**
 * Professional Travel Itinerary PDF Generator
 * Creates travel agency-style PDF documents
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

class TravelPDFGenerator {
  constructor() {
    this.primaryColor = [79, 70, 229]; // Indigo
    this.accentColor = [16, 185, 129]; // Green
    this.textColor = [17, 24, 39]; // Dark gray
    this.lightColor = [243, 244, 246]; // Light gray
  }

  /**
   * Generate complete travel itinerary PDF
   */
  async generateItineraryPDF(tripData, priceEstimate, weatherData, hotels, restaurants) {
    const doc = new jsPDF();
    let yPos = 20;

    // Add header
    yPos = this.addHeader(doc, tripData, yPos);
    
    // Add trip summary
    yPos = this.addTripSummary(doc, tripData, priceEstimate, yPos);
    
    // Add price breakdown
    if (priceEstimate) {
      yPos = this.addPriceBreakdown(doc, priceEstimate, yPos);
    }
    
    // Add day-by-day itinerary
    if (tripData.itinerary && tripData.itinerary.length > 0) {
      yPos = this.addDayByDayItinerary(doc, tripData.itinerary, weatherData, yPos);
    }
    
    // Add hotels section
    if (hotels && hotels.length > 0) {
      yPos = this.addHotelsSection(doc, hotels, yPos);
    }
    
    // Add restaurants section
    if (restaurants && restaurants.length > 0) {
      yPos = this.addRestaurantsSection(doc, restaurants, yPos);
    }
    
    // Add footer on all pages
    this.addFooter(doc, tripData);
    
    // Generate filename
    const filename = `${tripData.destination.replace(/[^a-z0-9]/gi, '_')}_Itinerary.pdf`;
    
    // Download
    doc.save(filename);
    
    return filename;
  }

  /**
   * Add professional header with logo and title
   */
  addHeader(doc, tripData, yPos) {
    const pageWidth = doc.internal.pageSize.width;
    
    // Header background
    doc.setFillColor(...this.primaryColor);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Company name/logo area
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('✈️ Trip AI', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Personalized Travel Planner', 20, 32);
    
    // Trip title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const title = `${tripData.destination} Travel Itinerary`;
    doc.text(title, pageWidth - 20, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tripData.dates || 'Flexible dates', pageWidth - 20, 32, { align: 'right' });
    
    return 60;
  }

  /**
   * Add trip summary box
   */
  addTripSummary(doc, tripData, priceEstimate, yPos) {
    const pageWidth = doc.internal.pageSize.width;
    
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    // Summary box
    doc.setFillColor(...this.lightColor);
    doc.roundedRect(15, yPos, pageWidth - 30, 45, 3, 3, 'F');
    
    // Content in 3 columns
    doc.setTextColor(...this.textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const col1X = 25;
    const col2X = 85;
    const col3X = 145;
    
    // Column 1: Duration
    doc.text('DURATION', col1X, yPos + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(tripData.duration || '5 days', col1X, yPos + 22);
    
    // Column 2: Travelers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAVELERS', col2X, yPos + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(tripData.travelers || '1 person', col2X, yPos + 22);
    
    // Column 3: Estimated Cost
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTIMATED COST', col3X, yPos + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...this.accentColor);
    const price = priceEstimate ? `€${priceEstimate.min.toLocaleString()} - €${priceEstimate.max.toLocaleString()}` : '€XXX';
    doc.text(price, col3X, yPos + 22);
    
    // Trip type/purpose
    doc.setTextColor(...this.textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const purpose = tripData.purpose || 'Solo';
    doc.text(`${purpose} Trip`, col1X, yPos + 35);
    
    return yPos + 55;
  }

  /**
   * Add price breakdown table
   */
  addPriceBreakdown(doc, priceEstimate, yPos) {
    const pageWidth = doc.internal.pageSize.width;
    
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.primaryColor);
    doc.text('💰 Cost Breakdown', 20, yPos);
    
    yPos += 10;
    
    // Create table data
    const tableData = [
      ['🏨 Accommodation', `€${priceEstimate.breakdownMin.accommodation.toLocaleString()} - €${priceEstimate.breakdownMax.accommodation.toLocaleString()}`],
      ['🍽️ Dining', `€${priceEstimate.breakdownMin.dining.toLocaleString()} - €${priceEstimate.breakdownMax.dining.toLocaleString()}`],
      ['🎭 Activities', `€${priceEstimate.breakdownMin.activities.toLocaleString()} - €${priceEstimate.breakdownMax.activities.toLocaleString()}`],
      ['🚇 Transportation', `€${priceEstimate.breakdownMin.transportation.toLocaleString()} - €${priceEstimate.breakdownMax.transportation.toLocaleString()}`]
    ];
    
    // Add table
    doc.autoTable({
      startY: yPos,
      head: [['Category', 'Estimated Cost Range']],
      body: tableData,
      foot: [['TOTAL RANGE', `€${priceEstimate.min.toLocaleString()} - €${priceEstimate.max.toLocaleString()}`]],
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: this.accentColor,
        fontSize: 11,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: pageWidth - 80 },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });
    
    yPos = doc.lastAutoTable.finalY + 5;
    
    // Add note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('*Estimated costs may vary based on season, availability, and personal preferences', 20, yPos);
    
    return yPos + 15;
  }

  /**
   * Add day-by-day itinerary
   */
  addDayByDayItinerary(doc, itinerary, weatherData, yPos) {
    // Section title
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.primaryColor);
    doc.text('📅 Day-by-Day Itinerary', 20, yPos);
    
    yPos += 12;
    
    itinerary.forEach((day, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Day header
      doc.setFillColor(240, 242, 255);
      doc.roundedRect(15, yPos - 5, doc.internal.pageSize.width - 30, 12, 2, 2, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.primaryColor);
      
      const dayTitle = day.date ? `Day ${day.day}: ${day.date}` : `Day ${day.day}`;
      doc.text(dayTitle, 20, yPos + 3);
      
      // Weather if available
      if (weatherData && weatherData.forecast && weatherData.forecast[index]) {
        const weather = weatherData.forecast[index];
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(
          `${weather.weatherEmoji} ${weather.temperatureMax}°C`,
          doc.internal.pageSize.width - 30,
          yPos + 3,
          { align: 'right' }
        );
      }
      
      yPos += 15;
      
      // Day title/theme
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.textColor);
      doc.text(day.title, 20, yPos);
      yPos += 7;
      
      // Activities
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach(activity => {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`• ${activity.name}`, 25, yPos);
          yPos += 5;
          
          if (activity.description) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const lines = doc.splitTextToSize(`  ${activity.description}`, 150);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 4;
            doc.setTextColor(...this.textColor);
          }
        });
        yPos += 2;
      }
      
      // Accommodation
      if (day.accommodation) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('🏨 Accommodation:', 25, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        const hotelName = typeof day.accommodation === 'object' 
          ? day.accommodation.name 
          : day.accommodation;
        doc.text(`  ${hotelName}`, 30, yPos);
        yPos += 6;
      }
      
      // Dining
      if (day.dining) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('🍽️ Dining:', 25, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        const restaurantName = typeof day.dining === 'object' 
          ? day.dining.name 
          : day.dining;
        doc.text(`  ${restaurantName}`, 30, yPos);
        yPos += 8;
      }
      
      yPos += 5;
    });
    
    return yPos;
  }

  /**
   * Add hotels section
   */
  addHotelsSection(doc, hotels, yPos) {
    // New page for hotels
    doc.addPage();
    yPos = 20;
    
    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.primaryColor);
    doc.text('🏨 Recommended Hotels', 20, yPos);
    
    yPos += 12;
    
    hotels.slice(0, 8).forEach((hotel, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      // Hotel box
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, yPos, doc.internal.pageSize.width - 30, 25, 2, 2, 'F');
      
      // Hotel name
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.textColor);
      doc.text(hotel.name, 20, yPos + 8);
      
      // Rating
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(234, 179, 8);
      doc.text(`★ ${hotel.rating.toFixed(1)}`, 20, yPos + 14);
      
      // Address
      doc.setTextColor(100, 100, 100);
      const address = hotel.address.length > 60 
        ? hotel.address.substring(0, 57) + '...' 
        : hotel.address;
      doc.text(address, 20, yPos + 20);
      
      yPos += 30;
    });
    
    return yPos;
  }

  /**
   * Add restaurants section
   */
  addRestaurantsSection(doc, restaurants, yPos) {
    // Check if we need new page
    if (yPos < 50) {
      // Continue on same page if space
    } else {
      doc.addPage();
      yPos = 20;
    }
    
    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.primaryColor);
    doc.text('🍽️ Recommended Restaurants', 20, yPos);
    
    yPos += 12;
    
    restaurants.slice(0, 8).forEach((restaurant, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      // Restaurant box
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, yPos, doc.internal.pageSize.width - 30, 25, 2, 2, 'F');
      
      // Restaurant name
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...this.textColor);
      doc.text(restaurant.name, 20, yPos + 8);
      
      // Rating
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(234, 179, 8);
      doc.text(`★ ${restaurant.rating.toFixed(1)}`, 20, yPos + 14);
      
      // Address
      doc.setTextColor(100, 100, 100);
      const address = restaurant.address.length > 60 
        ? restaurant.address.substring(0, 57) + '...' 
        : restaurant.address;
      doc.text(address, 20, yPos + 20);
      
      yPos += 30;
    });
    
    return yPos;
  }

  /**
   * Add footer to all pages
   */
  addFooter(doc, tripData) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(...this.primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 282, doc.internal.pageSize.width - 20, 282);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      
      doc.text(
        'Generated by Trip AI - Your Personalized Travel Planner',
        20,
        287
      );
      
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        287,
        { align: 'right' }
      );
      
      // Generation date
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(
        `Generated: ${date}`,
        doc.internal.pageSize.width / 2,
        287,
        { align: 'center' }
      );
    }
  }
}

export default new TravelPDFGenerator();

