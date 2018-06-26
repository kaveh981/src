
interface NotificationMedium {

    send(to: string, subject: string, message: string);

}

interface ArrayDiffResult {

    added: number[];
    removed: number[];

}
