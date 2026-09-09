import SwiftUI

struct GlassCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: RETuneTheme.cornerRadius, style: .continuous)
                    .fill(RETuneTheme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: RETuneTheme.cornerRadius, style: .continuous)
                            .stroke(RETuneTheme.border, lineWidth: 1)
                    )
            )
    }
}
