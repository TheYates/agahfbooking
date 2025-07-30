import { NextResponse } from 'next/server';
import { DepartmentService } from '@/lib/db-services';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const department = await DepartmentService.findById(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department
    });
    
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch department', 
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
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { name } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      );
    }

    const department = await DepartmentService.update(id, {
      name,
      description: body.description,
      slots_per_day: body.slots_per_day
    });
    
    return NextResponse.json({
      success: true,
      data: department
    });
    
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update department', 
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
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    await DepartmentService.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete department', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
