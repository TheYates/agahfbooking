import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function AppointmentsTableSkeleton() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="hidden xl:table-cell">Booked At</TableHead>
                        <TableHead className="hidden xl:table-cell">Reviewed By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton className="h-4 w-[100px]" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-[120px] rounded-full" />
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-4 w-[120px]" />
                                    <Skeleton className="h-3 w-[80px]" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                                <Skeleton className="h-4 w-[140px]" />
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-4 w-[80px]" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-[70px] rounded-full" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
