T = int(input())

for tc in range(1, T+1):

    N = int(input())  # 스위치 길이
    arr = list(map(int, input().split()))  # 스위치 lst
    M = int(input())  # 학생 수
    students = [tuple(map(int, input().split())) for _ in range(M)]  # (성별, 스위치 번호)


    for g, s in students: # g : 성별, s : 스위치 번호

        # 인덱스 위치에 맞게 조정
        # 주의 : 남, 여학생 간 출발 위치를 별도로 지정하자
        m_s = s-1 # 인덱스 번호 맞추기
        g_s = s-1

        if g == 1:                          # 1. 남학생이면
            while m_s < N:                  # 스위치 범위 내에서 반복
                arr[m_s] = 1 - arr[m_s]     # 0이면 1로, 1이면 0으로

                m_s += s                    # switch의 배수인 다음 번호로

        else:                               #2. 여학생이면
            if g_s == 0 or g_s == N-1:      # 2-(1). 여학생에게 양 끝 스위치가 주어진 경우
                arr[g_s] = 1 - arr[g_s]     # 대칭 비교가 불가하므로, 해당 번호만 변경

            else:                           # 2-(2) ~ N-1번 스위치라면
                arr[g_s] = 1 - arr[g_s]     # 자기 자신 변경

                i = 1                           # 인접 1칸부터 비교 시작
                while arr[g_s-i] == arr[g_s+i]: # 좌우대칭 값이 같은 동안 반복

                    arr[g_s-i] = 1 - arr[g_s-i]
                    arr[g_s+i] = 1 - arr[g_s+i]

                    i += 1 # 비교 범위 +1

                    if 0 <= g_s-i < N and 0 <= g_s+i < N: # 2-(3) 인덱스 바깥 범위를 참조하려고 하는 경우 - 반복 종료
                        pass
                    else: break

    print(f"#{tc} {arr}")