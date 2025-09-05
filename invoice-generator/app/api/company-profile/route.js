import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCachedUser } from "@/lib/userCache";
import prisma from "@/lib/prisma";

// GET /api/company-profile - Fetch company profile for the authenticated user
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use cached user lookup to reduce database queries
    const dbUser = await getCachedUser(userId);

    // Fetch user with company profile data
    const user = await prisma.user.findUnique({
      where: {
        id: dbUser.id,
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        companyEmail: true,
        companyLogo: true,
        bankName: true,
        bankAccount: true,
        defaultDueDays: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        companyName: user.companyName,
        companyEmail: user.companyEmail,
        companyLogo: user.companyLogo,
        bankName: user.bankName,
        bankAccount: user.bankAccount,
        defaultDueDays: user.defaultDueDays,
        hasCompanyProfile: !!(user.companyName && user.companyEmail),
      },
    });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/company-profile - Create or update company profile
export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, companyEmail, companyLogo, bankName, bankAccount, defaultDueDays, updateOption = "fromNow" } = body;
    
    console.log('Company profile update request:', { updateOption, companyName, companyEmail });

    // Validate required fields
    if (!companyName || !companyEmail) {
      return NextResponse.json(
        { error: "Company name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Use cached user lookup
    const dbUser = await getCachedUser(userId);

    // Update user with company profile data
    const updatedUser = await prisma.user.update({
      where: {
        id: dbUser.id,
      },
      data: {
        companyName: companyName.trim(),
        companyEmail: companyEmail.trim().toLowerCase(),
        companyLogo: companyLogo || null,
        bankName: bankName ? bankName.trim() : null,
        bankAccount: bankAccount ? bankAccount.trim() : null,
        defaultDueDays: defaultDueDays && String(defaultDueDays).trim() !== '' ? parseInt(defaultDueDays) : null,
      },
      select: {
        id: true,
        companyName: true,
        companyEmail: true,
        companyLogo: true,
        bankName: true,
        bankAccount: true,
        defaultDueDays: true,
      },
    });

    // If updateOption is "allInvoices", update all existing invoices with new company info
    let updatedInvoicesCount = 0;
    if (updateOption === "allInvoices") {
      console.log('Updating all invoices with new company info...');
      // Get all invoices for this user
      const invoices = await prisma.invoice.findMany({
        where: {
          client: {
            userId: dbUser.id,
          },
        },
        select: {
          id: true,
          data: true,
        },
      });
      
      console.log(`Found ${invoices.length} invoices to update`);

      // Update each invoice's data with new company information
      for (const invoice of invoices) {
        const invoiceData = invoice.data;

        // Update company information in invoice data
        if (invoiceData && typeof invoiceData === "object") {
          const updatedInvoiceData = {
            ...invoiceData,
            companyName: companyName.trim(),
            companyEmail: companyEmail.trim().toLowerCase(),
            companyLogo: companyLogo || null,
            bankName: bankName ? bankName.trim() : null,
            bankAccount: bankAccount ? bankAccount.trim() : null,
            defaultDueDays: defaultDueDays && String(defaultDueDays).trim() !== '' ? parseInt(defaultDueDays) : null,
          };

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { data: updatedInvoiceData },
          });
          
          updatedInvoicesCount++;
          console.log(`Updated invoice ${invoice.id} with new company data`);
        }
      }
    }
    


    return NextResponse.json({
      success: true,
      message: updateOption === "allInvoices" ? 
        `Company profile updated successfully. Updated ${updatedInvoicesCount} existing invoices.` : 
        "Company profile updated successfully",
      data: {
        companyName: updatedUser.companyName,
        companyEmail: updatedUser.companyEmail,
        companyLogo: updatedUser.companyLogo,
        bankName: updatedUser.bankName,
        bankAccount: updatedUser.bankAccount,
        defaultDueDays: updatedUser.defaultDueDays,
        updatedInvoicesCount: updatedInvoicesCount,
      },
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/company-profile - Update company profile (same as POST for this use case)
export async function PUT(request) {
  return POST(request);
}