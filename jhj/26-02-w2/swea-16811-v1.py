T = int(input())
for tc in range(1, T + 1):  # 테스트 케이스의 개수
    N = int(input())
    carrots = sorted(list(map(int, input().split())))
    result = len(carrots)
    # 뒤에 당근 2개는 남겨둬야함
    for i in range(N-2):
        # 앞에 당근 2개는 남겨둬야함
        for j in range(i+2, N):
            diff = 0
            # 각 상자의 범위(칸막이)에서 다른 상자에 같은수가있으면 다른 반복문으로
            if carrots[i] == carrots[i+1] or carrots[j-1] == carrots[j]:
                continue

            s_box = i + 1
            m_box = j - i - 1
            l_box = N - j

            # 각 박스의 범위가 넘어가면 다음 반복문으로
            if s_box > N//2 or m_box > N//2 or l_box > N//2:
                continue

            # 각 박스의 차 최솟값
            diff = max(abs(s_box-m_box), abs(m_box-l_box), abs(l_box-s_box))

            if result > diff:
                result = diff
    if result == len(carrots):
        result = -1
    print(f'#{tc} {result}')