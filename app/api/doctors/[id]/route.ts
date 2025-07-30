import { NextResponse } from 'next/server';
import { DoctorService } from '@/lib/db-services';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    const doctor = await DoctorService.findById(id);
    
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doctor
    });
    
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch doctor', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { name } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Doctor name is required' },
        { status: 400 }
      );
    }

    const doctor = await DoctorService.update(id, {
      name,
      department_id: body.department_id ? parseInt(body.department_id) : undefined
    });
    
    return NextResponse.json({
      success: true,
      data: doctor
    });
    
  } catch (error) {
    console.error('Error updating doctor:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update doctor', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid doctor ID' },
        { status: 400 }
      );
    }

    await DoctorService.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete doctor', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
