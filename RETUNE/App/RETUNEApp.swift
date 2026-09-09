import SwiftData
import SwiftUI

@main
struct RETUNEApp: App {
    var body: some Scene {
        WindowGroup {
            AppShellView()
        }
        .modelContainer(for: AttemptRecord.self)
    }
}
